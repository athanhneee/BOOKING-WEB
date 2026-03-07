import hero from "../../assets/img/NDT05929-HDR1.jpg";

const Hero = () => {
    return (
        <section
            className="h-[60vh] w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${hero})` }}
        />
    );
};

export default Hero;