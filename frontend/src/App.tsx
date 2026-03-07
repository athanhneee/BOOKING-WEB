import { Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
//import Hero from "./components/layout/Hero";
//import Footer from "./components/common/Footer";
import Home from "./pages/Home";
function App() {
  return (

    <Routes>
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={<>
            <Home />

          </>
          } />

        <Route path="/search" element={<>Tim kiem</>} />

      </Route>


      <Route path="*" element={<>Khong tim thay trang</>} />
      {/* <Route path="/" element={<Footer />}></Route> */}
    </Routes>
  );
}

export default App;