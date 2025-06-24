// import React, { useState, useEffect } from "react";
// import { FaCloudSun, FaGlobe, FaUsers, FaCheckCircle } from "react-icons/fa";

// const About = () => {
//   const [activeUsersCount, setActiveUsersCount] = useState(0);
//   const targetUsersCount = 500000;

//   // Live counting effect for Active Users
//   useEffect(() => {
//     const incrementCount = () => {
//       if (activeUsersCount < targetUsersCount) {
//         setActiveUsersCount((prevCount) =>
//           Math.min(
//             prevCount + Math.ceil(targetUsersCount / 200),
//             targetUsersCount
//           )
//         );
//       }
//     };

//     const interval = setInterval(incrementCount, 20);

//     return () => clearInterval(interval);
//   }, [activeUsersCount, targetUsersCount]);

//   return (
//     <div className="bg-gradient-to-br from-blue-50 to-blue-100 py-16">
//       <div className="container mx-auto p-8 pt-20">
//         {/* Main Heading */}
//         <h1 className="text-4xl font-extrabold mb-6 text-center text-blue-900">
//           About Climate Information Service App
//         </h1>

//         {/* Intro Section */}
//         <div className="text-center mb-10">
//           <p className="text-lg text-gray-700">
//             Our Climate Information Service App offers real-time, accurate, and
//             reliable weather data to keep you informed about weather changes
//             worldwide. Whether you&apos;re planning a trip, monitoring your
//             agricultural activities, or just want to be prepared for the day, we
//             have got you covered.
//           </p>
//         </div>

//         {/* Features Section */}
//         <section className="mb-12">
//           <h2 className="text-3xl font-bold mb-6 text-center text-blue-900">
//             Key Features
//           </h2>

//           <div className="grid md:grid-cols-3 gap-6">
//             {/* Feature 1 */}
//             <div className="text-center">
//               <FaCloudSun className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
//               <h3 className="text-2xl font-bold text-blue-900 mb-2">
//                 Real-Time Weather Data
//               </h3>
//               <p className="text-gray-600">
//                 Stay updated with the latest weather reports, including
//                 temperature, humidity, wind speed, and more, for any location.
//               </p>
//             </div>

//             {/* Feature 2 */}
//             <div className="text-center">
//               <FaGlobe className="h-12 w-12 text-green-500 mx-auto mb-4" />
//               <h3 className="text-2xl font-bold text-blue-900 mb-2">
//                 National Coverage
//               </h3>
//               <p className="text-gray-600">
//                 Our app provides weather updates for 261 of district across the
//                 nation.
//               </p>
//             </div>

//             {/* Feature 3 */}
//             <div className="text-center">
//               <FaCheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
//               <h3 className="text-2xl font-bold text-blue-900 mb-2">
//                 High Accuracy
//               </h3>
//               <p className="text-gray-600">
//                 We pride ourselves on delivering weather forecasts with an
//                 accuracy rate of over 90%, helping you make informed decisions.
//               </p>
//             </div>
//           </div>
//         </section>

//         {/* Metrics Section */}
//         <section className="bg-blue-50 p-8 rounded-lg shadow-lg mb-12">
//           <h2 className="text-3xl font-bold mb-6 text-center text-blue-900">
//             Our Impact
//           </h2>

//           <div className="grid md:grid-cols-3 gap-6 text-center">
//             {/* Metric 1: Active Users with Counting Animation */}
//             <div>
//               <FaUsers className="h-10 w-10 text-blue-600 mx-auto mb-2" />
//               <h3 className="text-2xl font-semibold text-blue-900">
//                 {activeUsersCount.toLocaleString()}+
//               </h3>
//               <p className="text-gray-600">Active Users</p>
//             </div>

//             {/* Metric 2 */}
//             <div>
//               <FaGlobe className="h-10 w-10 text-green-600 mx-auto mb-2" />
//               <h3 className="text-2xl font-semibold text-blue-900">150+</h3>
//               <p className="text-gray-600">Regions Covered</p>
//             </div>

//             {/* Metric 3 */}
//             <div>
//               <FaCheckCircle className="h-10 w-10 text-yellow-600 mx-auto mb-2" />
//               <h3 className="text-2xl font-semibold text-blue-900">92%</h3>
//               <p className="text-gray-600">Accuracy Rate</p>
//             </div>
//           </div>
//         </section>

//         {/* Mission Statement */}
//         <section className="mb-12">
//           <h2 className="text-3xl font-bold mb-6 text-center text-blue-900">
//             Our Mission
//           </h2>

//           <p className="text-lg text-gray-700 text-center max-w-4xl mx-auto">
//             Our mission is to empower individuals, farmers, and businesses with
//             the tools to make weather-conscious decisions. Whether it is
//             preparing for storms, optimizing agricultural productivity, or
//             simply planning a weekend trip, our goal is to ensure you have the
//             most accurate weather information at your fingertips.
//           </p>
//         </section>

//         {/* Call to Action */}
//         <section className="text-center mb-12">
//           <h2 className="text-3xl font-bold mb-6 text-center text-blue-900">
//             Join Us Today
//           </h2>

//           <p className="text-lg text-gray-700 mb-6">
//             Be part of our growing community and stay ahead of the weather.
//             Download our app now and get instant access to reliable and
//             up-to-date weather information!
//           </p>

//           <button className="bg-blue-900 text-white px-6 py-3 rounded-md text-lg hover:bg-blue-800 transition duration-300">
//             Download the App
//           </button>
//         </section>
//       </div>
//     </div>
//   );
// };

// export default About;

import React, { useState, useRef, useEffect } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  Github,
  Linkedin,
  Twitter,
  Globe,
  Award,
  Code,
  Brain,
  Users,
  Mail,
  MapPin,
  Calendar,
  Star,
  ChevronRight,
  Zap,
  Heart,
  Target,
} from "lucide-react";

const InnovatorsAbout = () => {
  const [activeInnovator, setActiveInnovator] = useState(0);
  const [isHovered, setIsHovered] = useState(null);

  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.6]);

  // Sample innovator data - replace with your actual team data
  const innovators = [
    {
      id: 1,
      name: "Dr. Sarah Chen",
      role: "Chief Technology Officer & AI Research Lead",
      specialization: "Machine Learning & Climate Modeling",
      image: "/api/placeholder/400/400",
      location: "Accra, Ghana",
      joinedYear: "2020",
      bio: "Pioneering AI-driven solutions for climate-smart agriculture with over 12 years of experience in machine learning and environmental data science. Led breakthrough research in predictive crop modeling.",
      achievements: [
        "Published 25+ papers on agricultural AI",
        "Winner of Global Climate Innovation Award 2023",
        "Former Google AI Research Scientist",
        "PhD in Computer Science from MIT",
      ],
      skills: [
        "Python",
        "TensorFlow",
        "Climate Data Analysis",
        "Deep Learning",
        "Agricultural IoT",
      ],
      socialLinks: {
        github: "https://github.com/sarahchen",
        linkedin: "https://linkedin.com/in/sarahchen",
        twitter: "https://twitter.com/sarahchen_ai",
        website: "https://sarahchen.dev",
      },
      stats: {
        projects: 15,
        publications: 25,
        citations: 1200,
        awards: 8,
      },
      quote:
        "Technology should serve humanity, especially those who feed the world.",
    },
    {
      id: 2,
      name: "James Osei",
      role: "Chief Product Officer & UX Design Lead",
      specialization: "Human-Centered Design & Agricultural Systems",
      image: "/api/placeholder/400/400",
      location: "Kumasi, Ghana",
      joinedYear: "2019",
      bio: "Passionate about creating intuitive interfaces that make complex agricultural data accessible to farmers. Expert in user research and product strategy with deep understanding of African agricultural challenges.",
      achievements: [
        "Led design for 50+ successful agtech products",
        "Google UX Design Certificate",
        "Featured speaker at Design Africa 2023",
        "15+ years in product design and strategy",
      ],
      skills: [
        "UI/UX Design",
        "Product Strategy",
        "User Research",
        "Figma",
        "React",
        "Design Systems",
      ],
      socialLinks: {
        github: "https://github.com/jamesosei",
        linkedin: "https://linkedin.com/in/jamesosei",
        twitter: "https://twitter.com/jamesosei_ux",
        website: "https://jamesosei.design",
      },
      stats: {
        projects: 50,
        designs: 200,
        userTests: 500,
        awards: 12,
      },
      quote: "Good design is invisible until it transforms lives.",
    },
    {
      id: 3,
      name: "Prof. Kwame Asante",
      role: "Chief Science Officer & Agricultural Expert",
      specialization: "Sustainable Agriculture & Climate Adaptation",
      image: "/api/placeholder/400/400",
      location: "Cape Coast, Ghana",
      joinedYear: "2018",
      bio: "Renowned agricultural scientist with 20+ years of experience in sustainable farming practices and climate adaptation strategies. Leading research on indigenous crop varieties and soil health optimization.",
      achievements: [
        "40+ years in agricultural research",
        "Author of 'Climate-Smart Farming in Africa'",
        "UN Food Systems Summit Expert",
        "Professor Emeritus at University of Ghana",
      ],
      skills: [
        "Agricultural Science",
        "Climate Adaptation",
        "Soil Science",
        "Crop Genetics",
        "Sustainable Farming",
      ],
      socialLinks: {
        linkedin: "https://linkedin.com/in/kwameasante",
        website: "https://kwameasante.research.edu",
      },
      stats: {
        publications: 80,
        citations: 3500,
        students: 200,
        awards: 15,
      },
      quote:
        "Indigenous wisdom combined with modern science creates the future of farming.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const cardVariants = {
    hidden: {
      scale: 0.8,
      opacity: 0,
      rotateY: -15,
    },
    visible: {
      scale: 1,
      opacity: 1,
      rotateY: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ y, opacity }}
        className="relative pt-20 pb-16 overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200/30 to-emerald-300/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              rotate: [360, 0],
              scale: [1.2, 1, 1.2],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-teal-200/30 to-green-300/30 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              delay: 0.2,
            }}
            className="inline-block p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-8"
          >
            <Users className="w-12 h-12 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-7xl font-extrabold mb-6"
          >
            <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Meet the Innovators
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12"
          >
            The brilliant minds behind the future of agriculture in Africa. Our
            diverse team combines cutting-edge technology with deep agricultural
            expertise to create solutions that truly matter.
          </motion.p>

          {/* Vision Statement */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="max-w-3xl mx-auto bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-xl"
          >
            <div className="flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-green-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-800">
                Our Mission
              </h3>
            </div>
            <p className="text-gray-700 italic text-lg">
              "To democratize access to climate-smart agricultural insights and
              empower farmers across Africa with the tools they need to thrive
              in a changing world."
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Innovators Section */}
      <section ref={containerRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Team Stats Overview */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          >
            {[
              {
                label: "Combined Experience",
                value: "45+",
                unit: "Years",
                icon: Calendar,
              },
              {
                label: "Research Publications",
                value: "130+",
                unit: "Papers",
                icon: Award,
              },
              {
                label: "Projects Delivered",
                value: "115+",
                unit: "Solutions",
                icon: Code,
              },
              {
                label: "Lives Impacted",
                value: "10K+",
                unit: "Farmers",
                icon: Heart,
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="inline-block p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl mb-4">
                  <stat.icon className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {stat.unit}
                </div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Innovators Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid lg:grid-cols-3 gap-8"
          >
            {innovators.map((innovator, index) => (
              <motion.div
                key={innovator.id}
                variants={cardVariants}
                className={`relative group cursor-pointer transition-all duration-500 ${
                  activeInnovator === index ? "lg:scale-105 z-10" : ""
                }`}
                onMouseEnter={() => {
                  setActiveInnovator(index);
                  setIsHovered(index);
                }}
                onMouseLeave={() => setIsHovered(null)}
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500">
                  {/* Profile Image Section */}
                  <div className="relative h-80 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-600/20" />
                    <img
                      src={innovator.image}
                      alt={innovator.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Floating Stats */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: isHovered === index ? 1 : 0,
                        y: isHovered === index ? 0 : 20,
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg"
                    >
                      <div className="flex items-center space-x-2 text-sm">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-gray-700">
                          {Object.values(innovator.stats)[0]}
                        </span>
                      </div>
                    </motion.div>

                    {/* Location Badge */}
                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-2">
                      <MapPin className="w-3 h-3 text-white" />
                      <span className="text-white text-xs font-medium">
                        {innovator.location}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          {innovator.name}
                        </h3>
                        <p className="text-green-600 font-semibold mb-1">
                          {innovator.role}
                        </p>
                        <p className="text-sm text-gray-500">
                          {innovator.specialization}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Since</div>
                        <div className="text-sm font-semibold text-gray-600">
                          {innovator.joinedYear}
                        </div>
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mb-6 border-l-4 border-green-500">
                      <p className="text-gray-700 italic text-sm leading-relaxed">
                        "{innovator.quote}"
                      </p>
                    </div>

                    {/* Bio */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                      {innovator.bio}
                    </p>

                    {/* Skills */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-green-500" />
                        Expertise
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {innovator.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {innovator.skills.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            +{innovator.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Achievements Preview */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <Award className="w-4 h-4 mr-2 text-green-500" />
                        Key Achievements
                      </h4>
                      <ul className="space-y-2">
                        {innovator.achievements
                          .slice(0, 2)
                          .map((achievement, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-gray-600 flex items-start"
                            >
                              <ChevronRight className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              {achievement}
                            </li>
                          ))}
                      </ul>
                    </div>

                    {/* Social Links */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="flex space-x-3">
                        {innovator.socialLinks.github && (
                          <a
                            href={innovator.socialLinks.github}
                            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            aria-label="GitHub Profile"
                          >
                            <Github className="w-4 h-4 text-gray-600" />
                          </a>
                        )}
                        {innovator.socialLinks.linkedin && (
                          <a
                            href={innovator.socialLinks.linkedin}
                            className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                            aria-label="LinkedIn Profile"
                          >
                            <Linkedin className="w-4 h-4 text-blue-600" />
                          </a>
                        )}
                        {innovator.socialLinks.twitter && (
                          <a
                            href={innovator.socialLinks.twitter}
                            className="p-2 bg-sky-100 rounded-lg hover:bg-sky-200 transition-colors"
                            aria-label="Twitter Profile"
                          >
                            <Twitter className="w-4 h-4 text-sky-600" />
                          </a>
                        )}
                        {innovator.socialLinks.website && (
                          <a
                            href={innovator.socialLinks.website}
                            className="p-2 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                            aria-label="Personal Website"
                          >
                            <Globe className="w-4 h-4 text-green-600" />
                          </a>
                        )}
                      </div>

                      <button className="flex items-center text-green-600 hover:text-green-700 text-sm font-medium">
                        <Mail className="w-4 h-4 mr-1" />
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1 }}
            className="text-center mt-20"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-12 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Join Our Mission
                </h2>
                <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
                  Together, we're building the future of agriculture. Connect
                  with our team and be part of the revolution.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-white text-green-600 px-8 py-3 rounded-xl font-semibold hover:bg-green-50 transition-colors flex items-center justify-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Get in Touch
                  </button>
                  <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-green-600 transition-colors flex items-center justify-center">
                    <Users className="w-5 h-5 mr-2" />
                    Join Our Team
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default InnovatorsAbout;
