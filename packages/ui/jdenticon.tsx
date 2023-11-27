// import React, { useRef, useEffect } from "react";
// import PropTypes from "prop-types";
// import {toSvg, update} from "jdenticon";
//
// export const Jdenticon = ({
//   value,
//   size = "100%",
//   className,
//   ...rest
// }: {
//   value: string;
//   size?: string;
//   className: string;
// } & React.SVGProps<SVGSVGElement>) => {
//
//   const svgString = toSvg(value, 100);
//
//   return (
//     <>
//       <Svg
//         data-jdenticon-value={value}
//         height={size}
//         ref={icon}
//         width={size}
//         className={className}
//         {...rest}
//       />
//     </>
//   );
// };
//
// // Jdenticon.propTypes = {
// //   size: PropTypes.string,
// //   value: PropTypes.string.isRequired
// // };
// // export default Jdenticon;
