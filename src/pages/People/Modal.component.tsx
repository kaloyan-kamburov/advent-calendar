import { FC, useEffect, useRef, useState, ComponentProps } from "react";
import { Fade } from "react-awesome-reveal";

interface Props {
  text: string;
  day: number;
  closeFn: () => void;
}

interface DynamicImageProps {
  imageName: string;
}

const DynamicImage: FC<DynamicImageProps> = ({ imageName }) => {
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    // Dynamically import the image based on `imageName`
    import(`./icons/${imageName}.svg`)
      .then((module) => {
        setImageSrc(module.default);
      })
      .catch((err) => console.error("Image not found", err));
  }, [imageName]);

  if (!imageSrc) return null; // Optionally, add a loader here

  return <img src={imageSrc} alt={imageName} />;
};

const ModalText: FC<Props> = ({ text, day, closeFn }) => {
  return (
    <div className="modal-text-wrapper">
      <div className="close-btn" onClick={closeFn}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 30 30"
          width="30px"
          height="30px"
        >
          <path d="M 7 4 C 6.744125 4 6.4879687 4.0974687 6.2929688 4.2929688 L 4.2929688 6.2929688 C 3.9019687 6.6839688 3.9019687 7.3170313 4.2929688 7.7070312 L 11.585938 15 L 4.2929688 22.292969 C 3.9019687 22.683969 3.9019687 23.317031 4.2929688 23.707031 L 6.2929688 25.707031 C 6.6839688 26.098031 7.3170313 26.098031 7.7070312 25.707031 L 15 18.414062 L 22.292969 25.707031 C 22.682969 26.098031 23.317031 26.098031 23.707031 25.707031 L 25.707031 23.707031 C 26.098031 23.316031 26.098031 22.682969 25.707031 22.292969 L 18.414062 15 L 25.707031 7.7070312 C 26.098031 7.3170312 26.098031 6.6829688 25.707031 6.2929688 L 23.707031 4.2929688 C 23.316031 3.9019687 22.682969 3.9019687 22.292969 4.2929688 L 15 11.585938 L 7.7070312 4.2929688 C 7.5115312 4.0974687 7.255875 4 7 4 z" />
        </svg>
      </div>
      <div className="modal-content">
        <div className="text-wrapper">
          <h5>{day} Декември</h5>
          <div className="text">
            <Fade delay={1e3} cascade damping={0.1}>
              {text}
            </Fade>
          </div>
        </div>
        <DynamicImage imageName={`${day}`} />
      </div>
    </div>
  );
};

export default ModalText;
