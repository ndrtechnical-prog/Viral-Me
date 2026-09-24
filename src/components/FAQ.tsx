import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQQuestion {
  id: string;
  qUrdu: string;
  qEn: string;
  aUrdu: string;
  aEn: string;
}

const MAIN_QUESTIONS: FAQQuestion[] = [
  {
    id: 'q1',
    qUrdu: 'Order kaise place karein aur yeh kaise process hota hai?',
    qEn: 'How do I place an order and how is it processed?',
    aUrdu:
      'Service muntakhib karein (Views, Likes, Followers, Shares, Saves), apni public TikTok video ka URL paste karein, campaign duration (1 se 30 din) set karein aur payment screenshot upload karein. Order foran automated verification queue me chala jata hai.',
    aEn:
      'Select your service (Views, Likes, Followers, Shares, Saves), paste your public video URL, select duration (1-30 days), and upload payment proof. Your order immediately enters the verification queue.'
  },
  {
    id: 'q2',
    qUrdu: 'Payment kon se tareeqon (Easypaisa / JazzCash / Zindigi) se bheji ja sakti hai?',
    qEn: 'Which payment methods (Easypaisa / JazzCash / Zindigi) are accepted?',
    aUrdu:
      'Aap Pakistan ke kisi bhi wallet (Easypaisa, JazzCash, ya Zindigi App) se official number 0305-2838367 (Title: Muhammad Nadir) par bhej kar screenshot upload kar sakte hain.',
    aEn:
      'Transfer easily via Easypaisa, JazzCash, or Zindigi App to official account 0305-2838367 (Muhammad Nadir) and upload receipt screenshot.'
  },
  {
    id: 'q3',
    qUrdu: 'Delivery kab shuru hoti hai aur total kitna time lagta hai?',
    qEn: 'When does delivery start and how long does it take?',
    aUrdu:
      'Payment approve hote hi 15 se 45 minutes me delivery start ho jati hai. 1-Day campaign 12-24 ghante me mukammal hoti hai, jabke multi-day campaigns rozana naturally distribute hoti hain.',
    aEn:
      'Delivery kicks off within 15-45 minutes of payment approval. 1-day orders finish in 12-24 hours; multi-day orders are smoothly paced daily.'
  },
  {
    id: 'q4',
    qUrdu: 'Kya mujhe apna TikTok password ya account login dena hoga?',
    qEn: 'Do I need to share my TikTok password or account login?',
    aUrdu:
      'Bilkul nahi! Hamein password ya login hargiz nahi chahiye. Hum sirf aapki video ya profile ka public URL istemal karte hain. 100% safe aur risk-free.',
    aEn:
      'Never! We only need your public video URL. We never ask for passwords or account login credentials.'
  },
  {
    id: 'q5',
    qUrdu: 'Kya video promotion service permanent aur drop-protected hai?',
    qEn: 'Is the video engagement service permanent and drop-protected?',
    aUrdu:
      'Jee haan! Tamam views, likes aur followers high-retention organic algorithm distribution ke zariye deliver hotay hain jo drop-protected aur permanent hain.',
    aEn:
      'Yes! All deliveries use high-retention algorithm distribution ensuring steady, non-drop, durable engagement.'
  }
];

interface FAQProps {
  onOpenTrackOrder?: () => void;
  className?: string;
}

export const FAQ: React.FC<FAQProps> = ({ className = '' }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div id="faq-section" className={`w-full space-y-3 ${className}`}>
      {/* Simple Header */}
      <div className="flex items-center gap-1.5 text-gray-700 dark:text-neutral-300 font-bold text-xs">
        <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>Frequently Asked Questions</span>
      </div>

      {/* Simple Question List (No separate bulky card) */}
      <div className="divide-y divide-gray-200/70 dark:divide-neutral-800 border-y border-gray-200/70 dark:border-neutral-800">
        {MAIN_QUESTIONS.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="py-2.5">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="w-full flex items-center justify-between text-left gap-2 text-xs font-semibold text-gray-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
              >
                <span>{item.qUrdu}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-blue-600' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="pt-2 pb-1 space-y-1 text-[11px] text-gray-600 dark:text-neutral-400 leading-relaxed animate-fadeIn">
                  <p>{item.aUrdu}</p>
                  <p className="text-[10px] text-gray-400 dark:text-neutral-500 italic">
                    {item.aEn}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
