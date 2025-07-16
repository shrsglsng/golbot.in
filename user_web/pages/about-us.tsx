import Navbar from "../shared/navbar"

function AboutUs() {
  return (
    <>
      <div className="w-full fixed top-0 z-10">
        <Navbar />
      </div>
      <div className="w-screen p-4 flex flex-col items-center">
        <div className="h-20" />
        <div className="text-2xl">About Us</div>
        <div className="h-4" />
        <div>
          {
            "Welcome to PaniPuri Vending Machines, where we're redefining how you enjoy PaniPuri. Our mission: to make ordering this iconic Indian street food from a vending machine a delightful and accessible experience."
          }
        </div>
        <div className="h-8" />
        <div className="text-2xl">Our Journey</div>
        <div className="h-4" />
        <div>
          {
            "Our founders' passion for PaniPuri inspired a journey of innovation. After years of dedicated work, we've developed an advanced vending machine that brings the authentic taste of PaniPuri to your fingertips."
          }
        </div>
        <div className="h-8" />
        <div className="text-2xl">Our Vision</div>
        <div className="h-4" />
        <div>
          {
            "We aim to spread the joy of PaniPuri globally while maintaining its authentic flavors. Our machines offer PaniPuri lovers around the world a convenient and hygienic way to savor this beloved snack."
          }
        </div>
        <div className="h-8" />
        <div className="text-2xl">Order PaniPuri Today</div>
        <div className="h-4" />
        <div>
          {
            "Don't wait! Experience the magic of ordering PaniPuri from our vending machines. Your favorite snack is just a click away."
          }
        </div>
        <div className="h-8" />
        <div className="text-2xl">Join Our PaniPuri Revolution</div>
        <div className="h-4" />
        <div>
          {
            "Explore our website, discover our vending machines, and redefine your PaniPuri experience. Whether you're a fan, a business owner looking to offer this delightful snack, or an investor, we have exciting opportunities for you."
          }
        </div>
      </div>
    </>
  )
}

export default AboutUs
