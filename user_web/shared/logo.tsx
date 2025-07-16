import Image from "next/image";

function Logo() {
  return <Image src={"/logo.svg"} alt="" fill={true} />;
}

export default Logo;
