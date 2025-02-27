import React from "react";
import { GrUserExpert } from "react-icons/gr";
import { FaBookReader } from "react-icons/fa";
import { FadeUp } from "../components/Hero";
import { motion } from "framer-motion";
import BannerPng from "../assets/banner.png";
import { BiMessageRoundedCheck } from "react-icons/bi";
import { FiAlertTriangle } from "react-icons/fi";
import { MdFactCheck } from "react-icons/md";
import { RiMessageFill } from "react-icons/ri";
import { FaMoneyBillTrendUp } from "react-icons/fa6";
import { GoAlertFill } from "react-icons/go";

const Banner = () => {
  return (
    <section>
      <div className="container py-20 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Banner Image */}
        <div className="flex justify-center items-center">
          <motion.img
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            src={BannerPng}
            alt="Banner"
            className="w-[500px] md:max-w-[600px] object-cover drop-shadow-lg"
          />
        </div>
        {/* Banner Text */}
        <div className="flex flex-col justify-center">
          <div className="text-center md:text-left space-y-12">
          <motion.h1
  initial={{ opacity: 0, scale: 0.5 }}
  whileInView={{ opacity: 1, scale: 1 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5 }}
  className="text-2xl md:text-4xl font-bold !leading-snug tracking-wide text-[#0e457f]"
>
  Optimisez votre consommation{" "}
  <span className="text-[#0c3a68]">et adoptez une gestion énergétique intelligente</span>
</motion.h1>



            <div className="flex flex-col gap-6">
              <motion.div
                variants={FadeUp(0.2)}
                initial="initial"
                whileInView={"animate"}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-6 bg-[#f4f4f4] rounded-2xl hover:bg-white duration-300 hover:shadow-2xl"
              >
                <MdFactCheck className="text-2xl" />
                <p className="text-lg">Contrôlez votre consommation d'énergie en direct et identifiez les sources de gaspillage.</p>
              </motion.div>
              <motion.div
                variants={FadeUp(0.4)}
                initial="initial"
                whileInView={"animate"}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-6 bg-[#f4f4f4] rounded-2xl hover:bg-white duration-300 hover:shadow-2xl"
              >
                <RiMessageFill className="text-2xl" />
                <p className="text-lg">Obtenez une estimation précise de vos factures avant leur émission pour mieux anticiper vos dépenses.</p>
              </motion.div>
              <motion.div
                variants={FadeUp(0.6)}
                initial="initial"
                whileInView={"animate"}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-6 bg-[#f4f4f4] rounded-2xl hover:bg-white duration-300 hover:shadow-2xl"
              >
                <FaMoneyBillTrendUp  className="text-2xl" />
                <p className="text-lg">Recevez des recommandations adaptées pour optimiser votre consommation et réduire vos coûts énergétiques</p>
              </motion.div>
              <motion.div
                variants={FadeUp(0.6)}
                initial="initial"
                whileInView={"animate"}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-6 bg-[#f4f4f4] rounded-2xl hover:bg-white duration-300 hover:shadow-2xl"
              >
                <GoAlertFill className="text-2xl" />
                <p className="text-lg">Soyez informé en cas d'anomalies ou de dépassements de consommation pour une gestion plus efficace.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
