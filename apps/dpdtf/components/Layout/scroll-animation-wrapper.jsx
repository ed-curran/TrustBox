import {motion} from "framer-motion";

export default function ScrollAnimationWrapper({children, className, ...props}) {
  return (
    <motion.div
      className={className}
      initial="offscreen"
      viewport={{ once: true, amount: 0.8 }}
      whileInView="onscreen"
      {...props}
    >
      {children}
    </motion.div>
  )
}