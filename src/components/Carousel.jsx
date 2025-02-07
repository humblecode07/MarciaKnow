import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const images = [
   "/Photos/1.jpg",
   "/Photos/2.jpg",
   "/Photos/3.jpg",
   "/Photos/4.jpg",
]

const Carousel = () => {
  const imagesRef = useRef([]);
  const tlRef = useRef(null);

  const updateCarousel = () => {
     const images = imagesRef.current;
     const screenWidth = window.innerWidth;

     // Reset positions
     gsap.set(images, { x: screenWidth });
     gsap.set(images[0], { x: 0 });

     // Create a new timeline
     const tl = gsap.timeline({ 
        repeat: -1, 
        defaults: { duration: 1, ease: 'power2.inOut' } 
     });

     images.forEach((img, index) => {
        const nextIndex = (index + 1) % images.length;

        tl.to(img, { 
           x: -screenWidth,
           delay: 2
        })
        .set(img, { x: screenWidth })
        .to(images[nextIndex], { x: 0 }, "-=1"); 
     });

     tlRef.current = tl; 
     tl.play();
  };

  useEffect(() => {
     updateCarousel(); 

     const handleResize = () => {
        if (tlRef.current) {
           tlRef.current.kill();
        }
        updateCarousel(); 
     };

     window.addEventListener('resize', handleResize);

     return () => {
        window.removeEventListener('resize', handleResize);
        if (tlRef.current) {
           tlRef.current.kill();
        }
     };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {images.map((src, index) => (
        <img
          key={index}
          ref={el => imagesRef.current[index] = el}
          src={src}
          alt={`Carousel image ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ))}
    </div>
  );
}

export default Carousel;