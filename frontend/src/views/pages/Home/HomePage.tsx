import { useState } from "react";
import Hero from "../../components/layout/Hero";
import PopularDestinationsSection from "../../components/listing/PopularDestinationsSection";
import SearchBar from "../../components/search/SearchBar";

const HomePage = () => {
    const [isPopularExpanded, setIsPopularExpanded] = useState(false);

    return (
        <>
            <Hero />
            <SearchBar forceHidden={isPopularExpanded} />
            <PopularDestinationsSection onExpandedChange={setIsPopularExpanded} />
        </>
    );
};

export default HomePage;
