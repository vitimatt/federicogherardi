'use client';

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
        className="opening-screen__image"
      />
    </div>
  );
}
