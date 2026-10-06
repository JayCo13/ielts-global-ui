import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import {Bell, ZoomIn, X, ChevronLeft, ChevronRight} from 'lucide-react';
import { createPortal } from 'react-dom';
import 'swiper/css';
import './FloatingNotification.css';
import API_BASE from '../config/api';
// Remove ImagePreviewModal import as we're creating our own

// Notification image URLs can be absolute (Cloudflare R2 upload) or relative
// (/static/... fallback). Only prepend API_BASE for relative paths — naively
// concatenating breaks R2 URLs (API_BASE + https://pub-...r2.dev/...).
const resolveNotificationImageUrl = (url) =>
  url && /^https?:\/\//i.test(url) ? url : `${API_BASE}${url}`;

// Create a new NotificationImageModal component for full screen display
const NotificationImageModal = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;
  
  return createPortal(
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-50 p-2 bg-black bg-opacity-50 rounded-full"
        aria-label="Close modal"
      >
        <X size={28} strokeWidth={2} />
      </button>
      
      <img 
        src={imageUrl} 
        alt="Notification image" 
        className="w-screen h-screen object-contain"
      />
    </div>,
    document.body
  );
};

// Slides loop, so slide 0 sits next to the last one. Plain subtraction would treat
// them as the furthest apart and drop the image right where the user is looking.
const ringDistance = (i, active, n) => {
  const d = Math.abs(i - active);
  return Math.min(d, n - d);
};

const FloatingNotification = ({ notifications = [], onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [swiper, setSwiper] = useState(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    // Reset visibility when new notifications arrive
    setIsVisible(true);
    setActive(0);
  }, [notifications]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose(); // This will now set lastClosedTime in the context
  };

  useEffect(() => {
    if (isVisible && notifications.length > 0) {
      // Auto-hide after 30 minutes of being visible
      const timer = setTimeout(() => {
        handleClose();
      }, 1800000); // 30 minutes in milliseconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, notifications]);

  // One slide per notification, each carrying its own date (VN fix). This used to
  // be two nested carousels (days outside, items within a day inside), which left
  // nothing sensible for prev/next to drive — the arrows would step days while an
  // inner autoplay moved items on its own. A flat list makes "3/7" and the arrows
  // mean exactly one thing.
  const items = notifications.map((n) => ({
    ...n,
    date: n.created_at
      ? new Date(n.created_at).toLocaleDateString('en-GB', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        })
      : 'Today',
  }));
  const many = items.length > 1;

  return (
    <AnimatePresence>
      {isVisible && items.length > 0 && (
        // z-[1000], not z-50: the floating icons on the right are z-[999] and sit
        // exactly where the "next" arrow lands, which buried it. No
        // -translate-x-1/2 here: paired with `right-3` it dragged the box a further
        // half-width to the left.
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            mass: 0.5
          }}
          className="fixed top-40 right-3 z-[1000] pointer-events-auto w-full max-w-[90vw] sm:max-w-md px-4"
        >
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 min-w-[300px] max-w-md overflow-hidden">

            {/* Header: date, position in the list, close button */}
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 min-w-0">
                <Bell className="shrink-0" size={14} strokeWidth={3} />
                <span className="truncate">Notification: {items[active]?.date}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {many && (
                  <span className="text-[11px] font-semibold tabular-nums text-gray-500">
                    {active + 1}/{items.length}
                  </span>
                )}
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full p-1 hover:bg-gray-100 focus:outline-none"
                  aria-label="Close notification"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="relative">
              <Swiper
                modules={[Autoplay]}
                spaceBetween={24}
                slidesPerView={1}
                autoHeight
                autoplay={{
                  delay: 8000,
                  // Once someone uses the arrows the carousel stops moving under
                  // them — they are reading, not browsing.
                  disableOnInteraction: true,
                  pauseOnMouseEnter: true,
                }}
                loop={many}
                onSwiper={setSwiper}
                onSlideChange={(sw) => setActive(sw.realIndex)}
                className="notification-swiper"
              >
                {items.map((notification, index) => (
                  <SwiperSlide key={`notification-${index}`}>
                    <div className={many ? 'px-8 py-3' : 'px-4 py-3'}>
                      {/* Swiper keeps every slide mounted; mounting every full-size
                          image exhausted iOS Safari's per-tab memory and crashed the
                          tab. Only the visible slide and its neighbours load images. */}
                      <NotificationItem
                        notification={notification}
                        showImage={ringDistance(index, active, items.length) <= 1}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {many && (
                <>
                  <button
                    type="button"
                    onClick={() => swiper?.slidePrev()}
                    aria-label="Previous notification"
                    className="absolute left-1 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-7 h-7 rounded-full bg-white/95 text-blue-600 shadow ring-1 ring-black/5 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => swiper?.slideNext()}
                    aria-label="Next notification"
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-7 h-7 rounded-full bg-white/95 text-blue-600 shadow ring-1 ring-black/5 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Extracted notification item component
const NotificationItem = ({ notification, showImage = true }) => {
  const { content, type = 'announcement', image_url } = notification;
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const handleImageClick = (e) => {
    e.stopPropagation(); // Stop event propagation
    setIsImageModalOpen(true);
  };

  return (
    <div className="flex flex-col">
      {/* Announcements are authored with real line breaks; keep them, left-aligned,
          and scroll long text inside the card instead of growing past the screen. */}
      <p className={`font-medium whitespace-pre-line break-words text-left leading-relaxed max-h-[40vh] overflow-y-auto
        ${type === 'update' ? 'text-green-700' : ''}
        ${type === 'announcement' ? 'text-blue-700' : ''}
        ${type === 'maintenance' ? 'text-orange-700' : ''}
      `}>{content}</p>
      {image_url && showImage && (
        <div
          className="relative cursor-pointer mt-3"
          onClick={handleImageClick}
        >
          <img
            src={resolveNotificationImageUrl(image_url)}
            alt="Notification image"
            loading="lazy"
            decoding="async"
            className="rounded-lg w-full max-w-[600px] max-h-[50vh] object-contain mx-auto transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg">
            <ZoomIn className="text-white absolute top-2 right-2 bg-black bg-opacity-40 p-1 rounded-full" size={24} strokeWidth={3}/>
          </div>
        </div>
      )}

      {/* Use our new NotificationImageModal for full screen display */}
      <NotificationImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={image_url ? resolveNotificationImageUrl(image_url) : ''}
      />
    </div>
  );
};

export default FloatingNotification;
