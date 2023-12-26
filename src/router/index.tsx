import {
  createBrowserRouter,
} from "react-router-dom";
import TransferPage from "../pages/TransferPage";
import MintPage from "../pages/MintPage";

const router = createBrowserRouter([
  {
    path: '/',
    children: [
      {
        path: '',
        element: <MintPage />,
      },
      {
        path: 'transfer',
        element: <TransferPage />,
      },
    ]
  },
])

export default router