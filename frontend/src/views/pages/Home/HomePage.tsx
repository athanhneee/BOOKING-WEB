import { useState } from "react";
import RecentlyViewedSection from "../../../features/recentlyViewed/RecentlyViewedSection";
import BlogHighlightsSection from "../../components/blog/BlogHighlightsSection";
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
            <SearchBar variant="home" forceHidden={isSearchBarHidden} forceVisible={shouldForceSearchBarVisible} />
            <RecentlyViewedSection />
            <PopularDestinationsSection
                onExpandedChange={setIsPopularExpanded}
                onSearchBarHiddenChange={setIsSearchBarHidden}
            />
            <BlogHighlightsSection />
        </>
    );
};

export default HomePage;
