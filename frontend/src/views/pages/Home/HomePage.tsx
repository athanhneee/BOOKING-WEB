import Hero from "../../components/layout/Hero";
import PopularDestinationsSection from "../../components/listing/PopularDestinationsSection";
import SearchBar from "../../components/search/SearchBar";

const HomePage = () => {
    return (
        <>
            <Hero />
            <SearchBar />
            <PopularDestinationsSection />
        </>
    );
};

export default HomePage;
