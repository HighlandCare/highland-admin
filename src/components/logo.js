import Image from "next/image";
import logo from "../../public/assets/logo.png";

export const Logo = ({ height = 40, width, alt = "Highland Care" }) => {
  return (
    <Image
      alt={alt}
      height={height}
      src={logo}
      style={{ height: "auto", maxWidth: "100%", width: width || "auto" }}
      width={width || height * 3}
    />
  );
};
