import hero from "../../../assets/img/NDT05929-HDR1.jpg";

const Hero = () => {
    return (
        <section
            className="h-[48vh] w-full bg-cover bg-[position:center_35%] sm:h-[55vh] md:h-[60vh] md:bg-center"
            style={{ backgroundImage: `url(${hero})` }}
        />
    );
};

export default Hero;
