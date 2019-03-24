import React, { Component } from 'react';
import './App.css';
import HeaderImg from './Components/Header'
import ToUse from './Components/Summary'

class App extends Component {
  state = {
    data: null,
    repoName: '',       // Expects this form: 'Github_user_name/repo_name' without the quotes
    githubUserName: '',
    error: null,
    loading: false,
    githubPRsData: []
  }

  resetState() {
    this.setState({
      data: null,
      repoName: '',
      githubUserName: '',       
      error: null,
      loading: false,
      githubPRsData: []
    })
  }

  componentDidMount() {
    // Call our fetch function below once the component mounts
    this.callBackendAPI()
      .then( res => { 
        this.setState({data: res.express},
      )})
      .catch( err => console.log(err) );
  }

  // Fetches our GET route from the express server. (Note the route we are fetching matches the GET route from server.js)
  callBackendAPI = async () => {
    const response = await fetch('/express_backend');
    const body = await response.json();

    if( response.status !== 200 ) {
      throw Error(body.message)
    }

    return body;
  }

  handleRepoChange(event) {
    const value = event.target.value;

    if( (value.split("/").length - 1) === 1 ) { 
      this.setState({
        repoName: value,
        error: null
      });
    } else {  /* invalid pathname */
      try{
        throw new Error('Invalid repo name');
      } 
      catch(error) {
        this.setState({
          repoName: '',
          error: error
        });
      };
      
    }
    
  }

  handleInputChange(event) {
    if( event.target.name === 'repoName' ) {
      this.handleRepoChange(event);
      return;
    }

    this.setState({
      [event.target.name]: event.target.value
    });
  }

  handleRepoSubmit() {
    this.setState({ loading: true });

    fetch(`https://api.github.com/repos/${this.state.repoName}/pulls?state=all`).then(response => {
      if(response.ok) {
        return response.json();   // This object if an json which contain an array of PR in json format.
      } else {
        throw new Error(`Cannot find any data on repo ${this.state.repoName}`);
      }
    }).then(pullData => {    // Does the first return from fetch gets transfered to this function? Because of the then? It does!
      this.setState({ 
        githubPRsData: pullData,
        loading: false
      })
    }).catch(error => {
      this.setState({
        error: error,
        loading: false
      })
    });

  }

  /* parse an array of json objects describing PR from github based on a condition
   * returns an array of json objects based on condition
   */
  parseGithubPRJson( githubPRJsonSet, condition, key ) {
    var parsedPRSet = [];

    if( condition === 'byName' ) {
      parsedPRSet = githubPRJsonSet.filter( eachElement => (
        eachElement.user.login === key
      ));
    }

    return parsedPRSet;
  }

  /* 
   * reports a list of PR base on the input array of github PR json objects
   */
  reportPRList( dataPR ) {
    if( dataPR === undefined ) {
      return(
        <div><h3>Array was undefined</h3></div>
      );
    }

    if( dataPR.length === 0 ) {
      return(
        <div><h3>Found no data</h3></div>
      );
    }

    return(
        dataPR.map( eachElement => (
          <div key={eachElement.id}>
            <h3><a href={eachElement.url}>{eachElement.id}</a></h3>
            <p>{eachElement.title}</p>
            <p>----------------------------</p>
          </div>
        ))
    );
  }

  /* 
   * @arg eachElement should be a json object.
   * meant to be used by reportPRListDetailed's returning html stuff
   */
  reportMergeStatue( eachElement ) {
    if(eachElement.state === 'open') {
      return('Open');
    }
    
    if(eachElement.merged_at === null) {
      return('Rejected...');
    } else {
      return('Merged!');
    }
  }

  /* 
   * reports a list of PR and their merge status base on the input array of github PR json objects
   */
  reportPRListDetailed( dataPR ) {
    if( dataPR === undefined ) {
      return(
        <div><h3>Array was undefined</h3></div>
      );
    }

    if( dataPR.length === 0 ) {
      return(
        <div><h3>Found no data</h3></div>
      );
    }

    var githubPRsDataDetailed;

    githubPRsDataDetailed = dataPR.map(
      eachElement => (
          <div key={eachElement.id}>
            <h3><a href={eachElement.url}> {eachElement.id} </a></h3>
            <p> {eachElement.title} </p>
            <p> By: {eachElement.user.login} </p>
            <p> Merged status: { this.reportMergeStatue(eachElement) } </p>
            <p>----------------------------</p>
          </div>
      )
    );

    return githubPRsDataDetailed;
  }

  handleKeyPress(e) {
    if(e.key === 'Enter') {
      this.handleRepoSubmit();
    }
  }

  render() {
    return (
      <div className="App">
        <HeaderImg/>
        {/* Render the newly fetched data insdie of this.state.data */}
        <p className="App-intro">Something here:{this.state.data}</p>

        <ToUse/>

        <div className="PRs">
          <input className={(this.state.error ? 'Warning' : 'inputbox')} 
            name="repoName"
            type="text" 
            placeholder="Enter information here" 
            onChange={this.handleInputChange.bind(this)} 
            onKeyPress={this.handleKeyPress.bind(this)}>
          </input>

          <input className="submit-query"
            type="submit" 
            value="Search"
            disabled={this.state.error} 
            onClick={this.handleRepoSubmit.bind(this)}>
          </input> 

          {/* make second submit for name, and if name and repo are entered, filter it. else just do repo. and don't allow submit if only name is filled in */}

        
          {this.state.loading ? <h2>loading ...</h2> : ''}
          {this.state.error ? <h2>{this.state.error.message}</h2> : ''}
          {/* this.reportPRList(this.state.githubPRsData) */}
          {/* this.reportPRListDetailed(this.state.githubPRsData) */}
          {this.reportPRListDetailed( this.parseGithubPRJson(this.state.githubPRsData, 'byName', 'yizongk') )}

        </div>

      </div>
    );
  }
}

export default App;
