import './App.css'
import Peers from './Peers'

function App (): JSX.Element {
  return (
    <div className="App">
      <h1>Secure Peer 2 Peer</h1>
      <div className="card">
        <Peers/>
      </div>
    </div>
  )
}

export default App
