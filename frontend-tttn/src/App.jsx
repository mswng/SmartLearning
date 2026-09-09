import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRoute.jsx';

function App() {
  return (
      <BrowserRouter>
        <AppRouter/>
      </BrowserRouter>
  )
}

export default App;