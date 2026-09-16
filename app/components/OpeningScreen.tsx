'use client';

import { useEffect, useState } from 'react';

type OpeningImage = {
  url: string;
  width: number;
  height: number;
};

type OpeningScreenProps = {
  image: OpeningImage;
  fading: boolean;
};

export function OpeningScreen({ image, fading }: OpeningScreenProps) {
  const [imageVisible, setImageVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setImageVisible(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className={`opening-screen ${fading ? 'opening-screen--fading' : ''}`}
      aria-hidden={fading}
    >
      <img
        src={image.url}
        width={image.width}
        height={image.height}
        alt=""
        className={`opening-screen__image${imageVisible ? ' opening-screen__image--visible' : ''}`}
      />
    </div>
  );
}
