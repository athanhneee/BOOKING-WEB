import Hero from "../components/layout/Hero";
import SearchBar from "../components/hotel/SearchBar";

const Home = () => {
    return (
        <>
            <Hero />
            <SearchBar />
            <div className="h-[80vh] bg-gray-100 p-4 md:p-10">
            </div>
        </>
    );
};

export default Home;
