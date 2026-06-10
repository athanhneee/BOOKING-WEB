import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const AppTree = googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </GoogleOAuthProvider>
) : (
    <BrowserRouter>
        <App />
    </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")!).render(AppTree);
