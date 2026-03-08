import { Routes, Route } from "react-router-dom";
import MainLayout from "./views/layouts/MainLayout";
import HomePage from "./views/pages/Home/HomePage";

function App() {
  return (

    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route
          index
          element={<>
            <HomePage />

          </>
          } />

        <Route path="/search" element={<>Tim kiem</>} />

      </Route>


      <Route path="*" element={<>Khong tim thay trang</>} />
    </Routes>
  );
}

export default App;
