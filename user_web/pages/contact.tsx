import Navbar from "../shared/navbar"

function ContactUs() {
  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-screen p-4 flex flex-col items-center">
        <div className="h-20" />
        <div>
          Got questions or need assistance? Our dedicated team is here to
          support you on your PaniPuri journey. <br />
          <br />
          Aibot Ink Pvt. Ltd.
          <br /> #22, 2nd Floor, Tanya Towers, <br /> 2nd Cross, Pampa extention
          Kempapura, <br /> Bangalore - 560024 Karnataka, India.
          <br />
          <br /> No. 50, SYNO.4/1 KNO 4668/50, <br /> M G Halli, A K Nagar,
          <br /> Bangalore - 560036 Karnataka, India.
          <br />
          <br />
          Phone : +91 80 9513 2345
          <br />
          Email : &nbsp;
          <a
            className="text-blue-700 underline"
            href="mailto:mail@aibotink.com">
            mail@aibotink.com
          </a>{" "}
          <br />
          <br />
          Join us in celebrating the joy of PaniPuri!
        </div>
      </div>
    </>
  )
}

export default ContactUs
