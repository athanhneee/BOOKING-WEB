import { useState } from "react";
import Hero from "../../components/layout/Hero";
import PopularDestinationsSection from "../../components/listing/PopularDestinationsSection";
import SearchBar from "../../components/search/SearchBar";

const HomePage = () => {
    const [isPopularExpanded, setIsPopularExpanded] = useState(false);
    const [isSearchBarHidden, setIsSearchBarHidden] = useState(false);
    const shouldForceSearchBarVisible = isPopularExpanded && !isSearchBarHidden;

    return (
        <>
            <Hero />
            <SearchBar forceHidden={isSearchBarHidden} forceVisible={shouldForceSearchBarVisible} />
            <PopularDestinationsSection
                onExpandedChange={setIsPopularExpanded}
                onSearchBarHiddenChange={setIsSearchBarHidden}
            />
        </>
    );
};

export default HomePage;
