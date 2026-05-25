import React, { useState, useRef, useEffect } from "react";
import { Baby, GraduationCap, HeartPulse, Apple, Users, Shield, ArrowRight, Heart, CheckCircle, Leaf, Target, Activity, Syringe, Smartphone, MessageSquare, Mail, Stethoscope, AlertTriangle, ShieldAlert, Brain, Radio, Flame, Coins, MapPin, Calendar, Tent, TreePine, Siren, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Link } from "react-router";
import { client } from "../lib/api/client";
import { motion, AnimatePresence, useInView, animate } from "motion/react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { useTranslation } from "react-i18next";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

function Counter({ from = 0, to, duration = 2, prefix = "", suffix = "", decimals = 0 }: { from?: number, to: number, duration?: number, prefix?: string, suffix?: string, decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (inView && ref.current) {
      const controls = animate(from, to, {
        duration,
        ease: "easeOut",
        onUpdate: (value) => {
          if (ref.current) {
            ref.current.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
          }
        }
      });
      return controls.stop;
    }
  }, [inView, from, to, duration, prefix, suffix, decimals]);

  return <span ref={ref}>{prefix}{from.toFixed(decimals)}{suffix}</span>;
}

function MobilePdfPreview({ pdfUrl, title }: { pdfUrl: string; title: string }) {
  const { t } = useTranslation('programs');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;

    const renderPreview = async () => {
      try {
        setHasError(false);

        const loadingTask = getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = 900;
        const scale = targetWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Canvas context unavailable");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({
          canvasContext: context,
          viewport,
          canvas,
        }).promise;

        if (!isActive) {
          await pdf.destroy();
          return;
        }

        setPreviewSrc(canvas.toDataURL("image/png"));
        await pdf.destroy();
      } catch {
        if (isActive) {
          setHasError(true);
        }
      }
    };

    void renderPreview();

    return () => {
      isActive = false;
    };
  }, [pdfUrl]);

  if (previewSrc) {
    return <img src={previewSrc} alt={title} className="h-full w-full object-cover object-top" />;
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(180deg,#f8f7f2_0%,#ece5d8_100%)] px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#e7d9a2] bg-white shadow-md">
        <Leaf className="h-8 w-8 text-[#1D6E3F]" />
      </div>
      <p className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#1D6E3F]">
        {t('mobilePdf.title')}
      </p>
      <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-[#5e5a4f]">
        {hasError ? t('mobilePdf.ready') : t('mobilePdf.generating')}
      </p>
    </div>
  );
}


const getPrograms = (t: any) => {
  const programsData = t('programsData', { returnObjects: true }) as any[];
  return [
    { ...programsData[0], icon: Baby, image: "/images/site-assets/program_prenatal.png" },
    { ...programsData[1], icon: HeartPulse, image: "/images/site-assets/program_childhood.png" },
    // { ...programsData[2], icon: Apple, image: "/images/site-assets/Mid-Day-meal-3.jpg" },
    { ...programsData[3], icon: GraduationCap, image: "/images/site-assets/Education-Support-01.jpg" },
    { ...programsData[4], icon: Users, image: "/images/site-assets/National-Youth-Policy_Featured-Image-1.jpg" },
    { ...programsData[5], icon: Shield, image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop" }
  ];
};

const getCarePillars = (t: any) => {
  const data = t('carePillarsData', { returnObjects: true }) as any[];
  return [
    {
      id: "01",
      title: data[0].title,
      color: "var(--journey-saffron)",
      bg: "from-[#fff5e8] to-white",
      border: "border-[#f4d6a3]",
      iconBg: "bg-[#fff2df]",
      Icon: Baby,
      points: data[0].points,
    },
    {
      id: "02",
      title: data[1].title,
      color: "#2ca86e",
      bg: "from-[#ecfbf3] to-white",
      border: "border-[#bfead2]",
      iconBg: "bg-[#e6f8ee]",
      Icon: HeartPulse,
      points: data[1].points,
    },
    {
      id: "03",
      title: data[2].title,
      color: "#6d63ff",
      bg: "from-[#f1efff] to-white",
      border: "border-[#d9d2ff]",
      iconBg: "bg-[#eeebff]",
      Icon: Brain,
      points: data[2].points,
    },
    {
      id: "04",
      title: data[3].title,
      color: "#3b82f6",
      bg: "from-[#eef5ff] to-white",
      border: "border-[#c9dcff]",
      iconBg: "bg-[#e9f2ff]",
      Icon: Shield,
      points: data[3].points,
    },
    {
      id: "05",
      title: data[4].title,
      color: "#6b9f2f",
      bg: "from-[#f3fae8] to-white",
      border: "border-[#d7e8b7]",
      iconBg: "bg-[#edf7dd]",
      Icon: Leaf,
      points: data[4].points,
    },
  ];
};

function FivePillarsSection() {
  const { t } = useTranslation('programs');
  const carePillars = getCarePillars(t);

  return (
    <section className="relative overflow-hidden bg-[#fbf8f1] py-20 sm:py-24 lg:py-28 border-y border-[#efe8da]">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute left-[10%] top-[12%] h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(29,110,63,0.12)_0%,_transparent_65%)] blur-3xl"
          animate={{ x: [0, 18, -10, 0], y: [0, -10, 12, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[8%] bottom-[10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(227,171,59,0.14)_0%,_transparent_70%)] blur-3xl"
          animate={{ x: [0, -16, 10, 0], y: [0, 12, -12, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 opacity-[0.22]" style={{ backgroundImage: "linear-gradient(rgba(29,110,63,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(29,110,63,0.05) 1px, transparent 1px)", backgroundSize: "38px 38px" }} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--womb-forest)]/15 bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--womb-forest)] shadow-sm backdrop-blur-sm">
            {t('fivePillars.badge')}
          </p>
          <h2 className="mt-5 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-[4rem]" style={{ lineHeight: 1.02 }}>
            {t('fivePillars.title1')}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--womb-forest)] via-[#29ae79] to-[#67c79f] italic">{t('fivePillars.title2')}</span>
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            {t('fivePillars.desc1')}<strong className="font-black text-gray-900">{t('fivePillars.descStrong1')}</strong>{t('fivePillars.desc2')}<strong className="font-black text-gray-900">{t('fivePillars.descStrong2')}</strong>{t('fivePillars.desc3')}
          </p>
        </motion.div>

        <div className="relative mt-12 sm:mt-16">
          <svg className="pointer-events-none absolute left-0 right-0 top-[5.4rem] hidden h-24 w-full lg:block" viewBox="0 0 1200 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pillarBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(29,110,63,0)" />
                <stop offset="20%" stopColor="rgba(29,110,63,0.18)" />
                <stop offset="50%" stopColor="rgba(227,171,59,0.32)" />
                <stop offset="80%" stopColor="rgba(29,110,63,0.18)" />
                <stop offset="100%" stopColor="rgba(29,110,63,0)" />
              </linearGradient>
            </defs>
            <motion.path
              d="M40 84 C220 30, 350 128, 520 84 S860 36, 1160 84"
              fill="none"
              stroke="url(#pillarBeam)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          </svg>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {carePillars.map((pillar, index) => (
              <motion.article
                key={pillar.id}
                initial={{ opacity: 0, y: 40, rotateX: 12 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-70px" }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -10 }}
                className="group relative"
                style={{ perspective: 1200 }}
              >
                <motion.div
                  className="absolute -inset-2 rounded-[2rem] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle, ${pillar.color}25 0%, transparent 70%)` }}
                />
                <div className={`relative h-full overflow-hidden rounded-[1.8rem] border ${pillar.border} bg-gradient-to-b ${pillar.bg} p-5 shadow-[0_14px_40px_-18px_rgba(0,0,0,0.12)] transition-all duration-500 group-hover:shadow-[0_28px_55px_-20px_rgba(0,0,0,0.18)]`}>
                  <motion.div
                    className="absolute right-4 top-4 h-16 w-16 rounded-full blur-2xl"
                    style={{ backgroundColor: pillar.color, opacity: 0.12 }}
                    animate={{ scale: [0.9, 1.08, 0.94], opacity: [0.08, 0.16, 0.1] }}
                    transition={{ duration: 3.6, repeat: Infinity, delay: index * 0.25, ease: "easeInOut" }}
                  />
                  <div className="relative z-10 flex min-h-[220px] flex-col">
                    <div className="flex items-start justify-between">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: pillar.color }}>
                        {t('fivePillars.pillarLabel')} {pillar.id}
                      </p>
                      <motion.div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${pillar.iconBg} shadow-inner ring-1 ring-black/5`}
                        animate={{ rotate: [0, -4, 4, 0], y: [0, -2, 2, 0] }}
                        transition={{ duration: 5, repeat: Infinity, delay: index * 0.25, ease: "easeInOut" }}
                      >
                        <pillar.Icon className="h-6 w-6" style={{ color: pillar.color }} />
                      </motion.div>
                    </div>

                    <h3 className="mt-6 text-[1.55rem] font-black tracking-tight text-gray-900 leading-[1.02]">
                      {pillar.title}
                    </h3>

                    <div className="mt-4 h-1.5 w-16 rounded-full transition-all duration-500 group-hover:w-24" style={{ backgroundColor: pillar.color }} />

                    <ul className="mt-5 space-y-2.5">
                      {pillar.points.map((point: string, pointIndex: number) => (
                        <motion.li
                          key={point}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.45, delay: 0.25 + index * 0.08 + pointIndex * 0.06 }}
                          className="flex items-start gap-3 text-[0.92rem] font-medium leading-snug text-gray-600"
                        >
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: pillar.color }} />
                          <span>{point}</span>
                        </motion.li>
                      ))}
                    </ul>

                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 rounded-[2rem] border border-white/70 bg-white/70 px-6 py-6 shadow-[0_18px_45px_-22px_rgba(0,0,0,0.12)] backdrop-blur-md sm:px-8"
        >
          <div className="grid gap-6 md:grid-cols-3 md:items-center">
            {[
              { value: "25", label: t('fivePillars.stat1') },
              { value: "32", label: t('fivePillars.stat2') },
              { value: "Preg-18", label: t('fivePillars.stat3') },
            ].map((stat, index) => (
              <div key={stat.label} className="relative">
                <p className="text-4xl font-black tracking-tight text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold text-gray-500">{stat.label}</p>
                {index < 2 && <div className="absolute right-0 top-1/2 hidden h-10 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-[#dcd6ca] to-transparent md:block" />}
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-[#ece5d8] pt-6">
            <p className="max-w-3xl text-lg leading-relaxed text-gray-600">
              <span className="font-black text-[var(--womb-forest)]">{t('fivePillars.bottomDesc1')}</span>{t('fivePillars.bottomDesc2')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function formatINR(amount: number) {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

function UpcomingCampsSection() {
  const { t } = useTranslation('programs');
  const [camps, setCamps] = useState<any[]>([]);

  useEffect(() => {
    client.get<any[]>('/camps/upcoming')
      .then(data => {
        const sorted = (data || [])
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3);
        setCamps(sorted);
      })
      .catch(() => setCamps([]));
  }, []);

  const purposeMap: any = {
    HEALTH: { img: "/images/camps/camp_health.png", color: "bg-emerald-50", text: "text-emerald-600" },
    EDUCATION: { img: "/images/camps/camp_education.png", color: "bg-blue-50", text: "text-blue-600" },
    ENVIRONMENT: { img: "/images/camps/camp_environment.png", color: "bg-green-50", text: "text-green-600" },
    COMMUNITY: { img: "/images/camps/camp_community.png", color: "bg-indigo-50", text: "text-indigo-600" },
    YOUTH: { img: "/images/camps/camp_youth.png", color: "bg-amber-50", text: "text-amber-600" },
  };

  if (camps.length === 0) return null;

  return (
    <section className="py-24 sm:py-32 bg-[#FBFCFA] border-t border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(29,110,63,0.05)_0%,_transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] bg-[radial-gradient(circle,_rgba(245,158,11,0.04)_0%,_transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 lg:mb-20"
        >
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm mb-6">
            <Tent className="w-4 h-4 mr-2" /> {t('upcomingCamps.badge')}
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-6">
            {t('upcomingCamps.title1')} <span className="text-emerald-500">{t('upcomingCamps.title1Span')}</span> <br />
            {t('upcomingCamps.title2')} <span className="text-amber-500 italic">{t('upcomingCamps.title2Span')}</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            {t('upcomingCamps.desc')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {camps.map((camp, i) => {
            const purpose = purposeMap[camp.purpose] || purposeMap.HEALTH;
            const campDate = new Date(camp.date);
            const participants = camp._count?.participations || 0;

            return (
              <motion.div
                key={camp.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex justify-center w-full"
              >
                <Card className="border border-[#e8dfce] bg-[#fcfbf9] shadow-[0_15px_40px_-15px_rgba(160,140,110,0.15)] rounded-[28px] hover:shadow-[0_25px_50px_-15px_rgba(160,140,110,0.25)] hover:-translate-y-1 transition-all duration-500 w-full max-w-[400px] flex flex-col p-6 mx-auto relative z-10 box-border h-full">

                  {/* Top Layer: Header + Image */}
                  <div className="flex gap-4 mb-4">

                    {/* Illustration Area */}
                    <div className={`relative w-[84px] h-[84px] flex-shrink-0 ${purpose.color || 'bg-emerald-50'} rounded-[20px] flex items-center justify-center group-hover:rotate-2 transition-transform duration-500 border border-white/50 shadow-inner`}>
                      <img src={purpose.img} alt={camp.purpose} className="w-[110%] h-[110%] object-contain relative z-10 -mt-1 drop-shadow-md" />

                      {/* Coins overlapping the image container */}
                      {camp.totalCoinPool > 0 && (
                        <div className="absolute -bottom-2 -right-3 bg-gradient-to-br from-amber-400 to-orange-500 text-white px-2.5 py-0.5 rounded-full shadow-lg shadow-orange-500/30 text-[10px] font-black flex items-center gap-1.5 border-[2px] border-white z-20">
                          <Coins size={12} strokeWidth={2.5} />
                          {camp.totalCoinPool >= 1000 ? (camp.totalCoinPool / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : camp.totalCoinPool}
                        </div>
                      )}
                    </div>

                    {/* Header Info */}
                    <div className="flex flex-col flex-1 justify-center pt-1">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${purpose.text || 'text-emerald-700'}`}>
                          {camp.purpose === "HEALTH" ? t('upcomingCamps.goodCamp') : `${camp.purpose} ${t('upcomingCamps.campSuffix')}`}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[#d6cfb8]" />
                        <span className="flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider border border-emerald-100 shadow-sm shadow-emerald-100/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                          {camp.status}
                        </span>
                      </div>
                      <h3 className="text-[19px] font-black text-[#2d2926] leading-[1.2] line-clamp-2 group-hover:text-amber-700 transition-colors">
                        {camp.name}
                      </h3>
                    </div>

                  </div>

                  {/* Description (Absorbs space naturally) */}
                  <div className="text-[13px] text-[#7a7161] font-medium leading-[1.6] line-clamp-2 mb-6 px-1 flex-1">
                    {camp.description && camp.description.length > 15 ? camp.description : t('upcomingCamps.defaultDesc')}
                  </div>

                  {/* Wrapper for Stats & Footer to stick to bottom neatly */}
                  <div className="mt-auto flex flex-col gap-5">
                    {/* Compact Stats Row */}
                    <div className="flex justify-between items-center bg-white/60 backdrop-blur-sm rounded-[18px] border border-[#efe9dc] shadow-[0_2px_10px_-2px_rgba(160,140,110,0.06)] p-3.5">

                      {/* Location slice */}
                      <div className="flex items-center gap-3 pr-1 w-1/2">
                        <div className="w-8 h-8 rounded-[12px] bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-[#efe9dc] flex-shrink-0 group-hover:text-emerald-500 transition-colors">
                          <MapPin size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col overflow-hidden w-full">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest leading-none mb-1">{t('upcomingCamps.where')}</span>
                          <span className="text-[12px] font-black text-stone-800 leading-none truncate w-full" title={camp.location}>{camp.location}</span>
                        </div>
                      </div>

                      {/* Separator line */}
                      <div className="w-[1px] h-8 bg-[#e8dfce]/60" />

                      {/* Date slice */}
                      <div className="flex items-center gap-3 pl-3 w-1/2">
                        <div className="w-8 h-8 rounded-[12px] bg-white flex items-center justify-center text-blue-600 shadow-sm border border-[#efe9dc] flex-shrink-0 group-hover:text-blue-500 transition-colors">
                          <Calendar size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest leading-none mb-1">{t('upcomingCamps.when')}</span>
                          <span className="text-[12px] font-black text-stone-800 leading-none">{campDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </div>

                    </div>

                    {/* Footer Group */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2 bg-purple-50/60 text-purple-700 px-3 py-2 rounded-[14px] border border-purple-100/40">
                        <Users size={14} strokeWidth={2.5} className="text-purple-600" />
                        <span className="text-[12px] font-bold">{participants} {t('upcomingCamps.volunteers')}</span>
                      </div>

                      <Link to="/volunteer/login">
                        <Button className="rounded-xl bg-[#2d2926] hover:bg-[#1a1714] text-white font-bold text-[13px] h-10 px-5 transition-all shadow-lg group-hover:scale-105 active:scale-95 border border-transparent hover:border-[#423c37] flex items-center gap-2">
                          {t('upcomingCamps.joinCamp')} <ArrowRight size={14} strokeWidth={3} />
                        </Button>
                      </Link>
                    </div>
                  </div>

                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  );
}

export function ServicesPage() {
  const { t } = useTranslation('programs');
  const programs = getPrograms(t);
  const [activeCategory, setActiveCategory] = useState("All Programs");

  const filteredPrograms = activeCategory === "All Programs"
    ? programs
    : programs.filter((p: any) => p.category === activeCategory);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-gradient-to-b from-[#f0faf4] to-white overflow-hidden relative border-b border-gray-100">
        {/* Subtle Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[70%] bg-[radial-gradient(ellipse_at_center,_var(--womb-forest)_0%,_transparent_70%)] opacity-[0.04] blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[70%] bg-[radial-gradient(ellipse_at_center,_var(--journey-saffron)_0%,_transparent_70%)] opacity-[0.03] blur-[80px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center text-center w-full max-w-4xl mx-auto"
          >
            <p className="inline-flex items-center gap-2 bg-[var(--womb-forest)]/10 text-[var(--womb-forest)] px-5 py-2.5 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase border border-[var(--womb-forest)]/20 mb-4 sm:mb-6 shadow-sm">
              {t('hero.badge')}
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-[4.5rem] text-gray-900 mb-6" style={{ fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.01em" }}>
              {t('hero.title1')}<br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--womb-forest)] to-[#36c276] drop-shadow-sm">{t('hero.title2')}</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl leading-relaxed">
              {t('hero.desc')}
            </p>
          </motion.div>
        </div>
      </section>

      <FivePillarsSection />

      {/* Programs Section */}
      <section className="py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Category Filters */}
          <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 flex-wrap mb-10">
            <span className="text-sm text-gray-400 font-bold uppercase tracking-wider hidden sm:block mr-2">{t('programsSection.categoriesLabel')}</span>
            {["All Programs", "Health", "Education", "Community"].map((cat) => (
              <Badge
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`cursor-pointer px-4 py-2 transition-all duration-300 font-semibold shadow-sm hover:shadow-md ${activeCategory === cat
                  ? "bg-[var(--womb-forest)] text-white hover:bg-[var(--womb-forest)]/90 scale-105"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[var(--womb-forest)]/30 hover:text-[var(--womb-forest)]"
                  }`}
              >
                {t(`programsSection.categories.${cat}`) as string}
              </Badge>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
              }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredPrograms.map((program) => {
                return (
                  <motion.div key={program.title} variants={{
                    hidden: { opacity: 0, y: 50, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 50, damping: 15 } }
                  }}>
                    <Card className="bg-white border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden group hover:shadow-[0_20px_50px_-15px_rgba(29,110,63,0.15)] transition-all duration-500 h-full flex flex-col rounded-[2rem]">
                      {/* Image */}
                      <div className="relative h-36 overflow-hidden rounded-t-[2rem]">
                        <img
                          src={program.image}
                          alt={program.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                        />
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <Badge className="bg-white/95 text-[var(--womb-forest)] backdrop-blur-sm text-[10px] px-2 py-0.5 font-bold shadow-sm border-none">{program.category}</Badge>
                          <Badge className="bg-[var(--journey-saffron)] text-white text-[10px] px-2 py-0.5 shadow-sm border-none">{program.status}</Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="bg-white/95 backdrop-blur-sm text-[9px] px-2.5 py-0.5 rounded-full text-[var(--womb-forest)] font-bold shadow-sm inline-flex items-center">
                            {program.age}
                          </span>
                        </div>
                        {/* Gradient Overlay for seamless blend */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>

                      <CardContent className="p-4 md:p-5 flex-1 flex flex-col pt-4 z-10 bg-white relative">
                        {/* Sub-Glow */}
                        <div className="absolute -top-6 -right-6 w-20 h-20 bg-[var(--womb-forest)]/5 rounded-full blur-[15px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        {/* Title & Icon */}
                        <div className="flex items-center gap-3 mb-2.5">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--womb-forest)]/10 to-[var(--womb-forest)]/5 flex items-center justify-center shrink-0 border border-[var(--womb-forest)]/20 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                            <program.icon className="h-5 w-5 text-[var(--womb-forest)]" />
                          </div>
                          <div>
                            <h3 className="text-[1.15rem] leading-tight text-gray-900 font-bold group-hover:text-[var(--womb-forest)] transition-colors duration-300 tracking-tight">{program.title}</h3>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[0.85rem] text-gray-600 mb-3 flex-1 leading-snug">{program.description}</p>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-1 mb-4 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 group-hover:bg-white group-hover:border-[var(--womb-forest)]/10 transition-colors">
                          {program.features.map((f: string) => (
                            <div key={f} className="flex items-start gap-1.5 text-[11px] text-gray-600 font-medium">
                              <div className="h-1.5 w-1.5 rounded-full bg-[var(--womb-forest)]/40 group-hover:bg-[var(--womb-forest)] shrink-0 mt-1 transition-colors" />
                              <span className="leading-tight">{f}</span>
                            </div>
                          ))}
                        </div>

                        {/* Target & Donate */}
                        <div className="border-t border-gray-100 pt-3 mt-auto flex justify-between items-center">
                          <span className="text-[10px] text-[var(--journey-saffron)] font-bold bg-[var(--journey-saffron)]/10 px-2.5 py-1 rounded-md leading-none uppercase tracking-wider">🎯 {program.target2026}</span>
                          <Link to="/donate">
                            <Button size="sm" className="bg-[var(--womb-forest)] hover:bg-[#155e33] h-8 px-4 text-[11px] font-bold rounded-lg shadow hover:shadow-md transition-all group-hover:scale-105">
                              <Heart className="h-3 w-3 mr-1.5" /> {t('programsSection.donateNow')}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Cinematic Lifelong Health Journey */}
      <section className="py-20 sm:py-32 bg-white relative overflow-hidden border-t border-gray-100">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--womb-forest)_0%,_transparent_50%)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--journey-saffron)_0%,_transparent_50%)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-24"
          >
            <p className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-600 px-5 py-2.5 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase border border-indigo-500/20 mb-4 sm:mb-6 shadow-sm">
              {t('careContinuum.badge')}
            </p>
            <h2 className="text-[2.2rem] sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 sm:mb-6 drop-shadow-sm tracking-tight leading-[0.95]">{t('careContinuum.title')}</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('careContinuum.desc1')}<strong className="text-gray-900 font-bold bg-indigo-50 px-1 rounded">{t('careContinuum.descStrong')}</strong>{t('careContinuum.desc2')}
            </p>
          </motion.div>

          <div className="md:hidden max-w-md mx-auto">
            <div className="space-y-5">
              <div className="rounded-[1.75rem] border border-[#dbeadf] bg-gradient-to-br from-white to-[#f7fbf8] p-5 shadow-[0_12px_35px_-20px_rgba(29,110,63,0.25)]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--womb-forest)]/10 text-[var(--womb-forest)]">
                    <Baby className="h-5 w-5" />
                  </div>
                  <Badge className="bg-[var(--womb-forest)] text-white hover:bg-[var(--womb-forest)]/90 border-none shadow-sm font-bold px-3 py-1">{t('careContinuum.stage1.badge')}</Badge>
                </div>
                <h3 className="text-[1.75rem] font-extrabold text-gray-900 tracking-tight leading-none">{t('careContinuum.stage1.title')}</h3>
                <p className="mt-3 text-[0.98rem] text-gray-600 leading-7 font-medium">{t('careContinuum.stage1.desc')}</p>
              </div>

              <div className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 p-5 shadow-[0_12px_35px_-20px_rgba(59,130,246,0.25)]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <Badge className="bg-blue-600 text-white hover:bg-blue-700 border-none shadow-sm font-bold px-3 py-1">{t('careContinuum.stage2.badge')}</Badge>
                </div>
                <h3 className="text-[1.75rem] font-extrabold text-gray-900 tracking-tight leading-none">{t('careContinuum.stage2.title')}</h3>
                <p className="mt-3 text-[0.98rem] text-gray-600 leading-7 font-medium">{t('careContinuum.stage2.desc')}</p>
              </div>

              <div className="rounded-[1.75rem] border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40 p-5 shadow-[0_12px_35px_-20px_rgba(99,102,241,0.25)]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Heart className="h-5 w-5" />
                  </div>
                  <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 border-none shadow-sm font-bold px-3 py-1">{t('careContinuum.stage3.badge')}</Badge>
                </div>
                <h3 className="text-[1.7rem] font-extrabold text-gray-900 tracking-tight leading-none">{t('careContinuum.stage3.title')}</h3>

                <div className="mt-5 space-y-3.5">
                  <div className="rounded-[1.25rem] border border-indigo-100 bg-indigo-50/70 p-4">
                    <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold text-indigo-600 shadow-sm">{t('careContinuum.stage3.prenatalBadge')}</div>
                    <p className="text-[0.95rem] font-bold leading-snug text-gray-900">{t('careContinuum.stage3.prenatalTitle')}</p>
                    <p className="mt-2 text-xs leading-6 text-gray-600">{t('careContinuum.stage3.prenatalDesc')}</p>
                  </div>

                  <div className="rounded-[1.25rem] border border-[#dbeadf] bg-[#f0faf4]/80 p-4">
                    <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[var(--womb-forest)] shadow-sm">{t('careContinuum.stage3.age05Badge')}</div>
                    <p className="text-[0.95rem] font-bold leading-snug text-gray-900">{t('careContinuum.stage3.age05Title')}</p>
                    <p className="mt-2 text-xs leading-6 text-gray-600">{t('careContinuum.stage3.age05Desc')}</p>
                  </div>

                  <div className="rounded-[1.25rem] border border-blue-100 bg-blue-50/70 p-4">
                    <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold text-blue-600 shadow-sm">{t('careContinuum.stage3.age612Badge')}</div>
                    <p className="text-[0.95rem] font-bold leading-snug text-gray-900">{t('careContinuum.stage3.age612Title')}</p>
                    <p className="mt-2 text-xs leading-6 text-gray-600">{t('careContinuum.stage3.age612Desc')}</p>
                  </div>

                  <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50/70 p-4">
                    <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold text-amber-600 shadow-sm">{t('careContinuum.stage3.age1318Badge')}</div>
                    <p className="text-[0.95rem] font-bold leading-snug text-gray-900">{t('careContinuum.stage3.age1318Title')}</p>
                    <p className="mt-2 text-xs leading-6 text-gray-600">{t('careContinuum.stage3.age1318Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative max-w-5xl mx-auto px-4 md:px-0 hidden md:block">
            {/* Central Animated Timeline Line */}
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute left-[36px] md:left-1/2 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-[var(--womb-forest)] to-indigo-500/30 -translate-x-1/2 rounded-full origin-top"
            />

            {/* Journey Milestones Container */}
            <div className="space-y-16 md:space-y-24">
              {/* Stage 1: Immunization */}
              <div className="relative flex flex-col md:flex-row items-center justify-between group/stage">
                <div className="md:w-[45%] hidden md:block" />

                {/* Glowing Node */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                  className="absolute left-[36px] md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-[4px] border-[var(--womb-forest)] shadow-[0_0_20px_rgba(29,110,63,0.3)] z-10 flex items-center justify-center text-[var(--womb-forest)]"
                >
                  <Baby className="w-6 h-6" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  className="w-full md:w-[45%] pl-[80px] md:pl-0"
                >
                  <div className="bg-white p-8 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-[0_30px_60px_-15px_rgba(29,110,63,0.15)] hover:border-[var(--womb-forest)]/30 transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-br from-[var(--womb-forest)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-xl" />
                    <div className="relative z-10">
                      <Badge className="bg-[var(--womb-forest)] text-white hover:bg-[var(--womb-forest)]/90 mb-5 border-none shadow-sm font-bold px-3 py-1">{t('careContinuum.stage1.badge')}</Badge>
                      <h3 className="text-2xl font-extrabold text-gray-900 mb-3 hover:text-[var(--womb-forest)] transition-colors tracking-tight">{t('careContinuum.stage1.title')}</h3>
                      <p className="text-gray-600 leading-relaxed font-medium">{t('careContinuum.stage1.desc')}</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Stage 2: School Age Immunity */}
              <div className="relative flex flex-col md:flex-row items-center justify-between group/stage">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  className="w-full md:w-[45%] pl-[80px] md:pl-0 order-2 md:order-1 mt-8 md:mt-0"
                >
                  <div className="bg-white p-8 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-[0_30px_60px_-15px_rgba(59,130,246,0.15)] hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden group md:text-right">
                    <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-xl" />
                    <div className="relative z-10 flex flex-col items-start md:items-end">
                      <Badge className="bg-blue-600 text-white hover:bg-blue-700 mb-5 border-none shadow-sm font-bold px-3 py-1">{t('careContinuum.stage2.badge')}</Badge>
                      <h3 className="text-2xl font-extrabold text-gray-900 mb-3 hover:text-blue-600 transition-colors tracking-tight">{t('careContinuum.stage2.title')}</h3>
                      <p className="text-gray-600 leading-relaxed font-medium text-left md:text-right">{t('careContinuum.stage2.desc')}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Glowing Node */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                  className="absolute left-[36px] md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-[4px] border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] z-10 flex items-center justify-center text-blue-500 order-1"
                >
                  <Shield className="w-6 h-6" />
                </motion.div>

                <div className="md:w-[45%] hidden md:block order-3" />
              </div>

              {/* Stage 3: Mental Wellness & Skills */}
              <div className="relative flex flex-col md:flex-row items-center justify-between group/stage">
                <div className="md:w-[45%] hidden md:block" />

                {/* Glowing Node */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                  className="absolute left-[36px] md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-[4px] border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] z-10 flex items-center justify-center text-indigo-500"
                >
                  <Heart className="w-6 h-6" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  className="w-full md:w-[45%] pl-[80px] md:pl-0 mt-8 md:mt-0"
                >
                  <div className="bg-white p-8 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-[0_30px_60px_-15px_rgba(99,102,241,0.15)] hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-xl" />
                    <div className="relative z-10">
                      <Badge className="bg-indigo-600 text-white hover:bg-indigo-700 mb-5 border-none shadow-sm font-bold px-3 py-1">{t('careContinuum.stage3.badge')}</Badge>
                      <h3 className="text-2xl font-extrabold text-gray-900 mb-5 hover:text-indigo-600 transition-colors tracking-tight">{t('careContinuum.stage3.title')}</h3>

                      <div className="space-y-4">
                        <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100/50 hover:bg-indigo-100/50 transition-colors flex gap-4 items-center">
                          <div className="h-10 px-3 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 whitespace-nowrap">{t('careContinuum.stage3.prenatalBadge')}</div>
                          <div>
                            <p className="font-bold text-gray-900 text-[0.9rem] leading-tight mb-1">{t('careContinuum.stage3.prenatalTitle')}</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{t('careContinuum.stage3.prenatalDesc')}</p>
                          </div>
                        </div>

                        <div className="bg-[#f0faf4]/70 p-4 rounded-xl border border-[#a7e8c3]/30 hover:bg-[#f0faf4]/80 transition-colors flex gap-4 items-center">
                          <div className="h-10 px-3 rounded-full bg-white shadow-sm flex items-center justify-center text-[var(--womb-forest)] font-bold text-xs shrink-0 whitespace-nowrap">{t('careContinuum.stage3.age05Badge')}</div>
                          <div>
                            <p className="font-bold text-gray-900 text-[0.9rem] leading-tight mb-1">{t('careContinuum.stage3.age05Title')}</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{t('careContinuum.stage3.age05Desc')}</p>
                          </div>
                        </div>

                        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100/50 hover:bg-blue-100/50 transition-colors flex gap-4 items-center">
                          <div className="h-10 px-3 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 font-bold text-xs shrink-0 whitespace-nowrap">{t('careContinuum.stage3.age612Badge')}</div>
                          <div>
                            <p className="font-bold text-gray-900 text-[0.9rem] leading-tight mb-1">{t('careContinuum.stage3.age612Title')}</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{t('careContinuum.stage3.age612Desc')}</p>
                          </div>
                        </div>

                        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-100/50 hover:bg-amber-100/50 transition-colors flex gap-4 items-center">
                          <div className="h-10 px-3 rounded-full bg-white shadow-sm flex items-center justify-center text-amber-600 font-bold text-xs shrink-0 whitespace-nowrap">{t('careContinuum.stage3.age1318Badge')}</div>
                          <div>
                            <p className="font-bold text-gray-900 text-[0.9rem] leading-tight mb-1">{t('careContinuum.stage3.age1318Title')}</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{t('careContinuum.stage3.age1318Desc')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Flagship Programs */}
      <section className="py-24 relative bg-gray-50/30 overflow-hidden border-t border-gray-100">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--womb-forest)_0%,_transparent_60%)] opacity-[0.03] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--journey-saffron)_0%,_transparent_60%)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16 lg:mb-24"
          >
            <p className="inline-flex items-center gap-2 bg-[var(--womb-forest)]/10 text-[var(--womb-forest)] px-5 py-2.5 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase border border-[var(--womb-forest)]/20 mb-6 shadow-sm">
              {t('flagship.badge')}
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-gray-900 mb-6 tracking-tight drop-shadow-sm leading-tight">
              {t('flagship.title1')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--womb-forest)] to-[#36c276]">{t('flagship.title2')}</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('flagship.desc')}
            </p>
          </motion.div>

          {/* Integrated School Health - Bento Grid */}
          <div className="mb-24 lg:mb-32 perspective-[1200px]">
            <motion.div
              initial={{ opacity: 0, y: 40, rotateX: 5 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, type: "spring", stiffness: 40 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col lg:flex-row gap-12 lg:gap-16 relative overflow-hidden group hover:shadow-[0_30px_80px_-15px_rgba(29,110,63,0.1)] transition-all duration-700"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--womb-forest)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="lg:w-1/3 flex flex-col justify-center relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--womb-forest)]/10 to-[var(--womb-forest)]/5 border border-[var(--womb-forest)]/20 shadow-inner flex items-center justify-center mb-8 shrink-0 relative">
                  <div className="absolute inset-0 bg-[var(--womb-forest)]/20 blur-xl rounded-full" />
                  <Stethoscope className="w-8 h-8 text-[var(--womb-forest)] relative z-10" />
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">{t('flagship.integratedSchoolHealth.title1')}<br className="hidden lg:block" />{t('flagship.integratedSchoolHealth.title2')}</h3>
                <Badge className="w-max bg-[var(--journey-saffron)]/10 text-[var(--journey-saffron)] border-none px-4 py-1.5 font-bold mb-6 text-xs uppercase tracking-wider">{t('flagship.integratedSchoolHealth.badge')}</Badge>

                <p className="text-gray-600 leading-relaxed mb-8">
                  {t('flagship.integratedSchoolHealth.desc')}
                </p>

                <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 group/item">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover/item:scale-110 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all"><Users className="w-4 h-4" /></div>
                    <span className="text-sm font-semibold text-gray-800">{(t('flagship.integratedSchoolHealth.items', { returnObjects: true }) as string[])[0]}</span>
                  </div>
                  <div className="flex items-center gap-3 group/item">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-[var(--womb-forest)] flex items-center justify-center shrink-0 group-hover/item:scale-110 group-hover/item:bg-[var(--womb-forest)] group-hover/item:text-white transition-all"><Activity className="w-4 h-4" /></div>
                    <span className="text-sm font-semibold text-gray-800">{(t('flagship.integratedSchoolHealth.items', { returnObjects: true }) as string[])[1]}</span>
                  </div>
                  <div className="flex items-center gap-3 group/item">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover/item:scale-110 group-hover/item:bg-purple-600 group-hover/item:text-white transition-all"><CheckCircle className="w-4 h-4" /></div>
                    <span className="text-sm font-semibold text-gray-800">{(t('flagship.integratedSchoolHealth.items', { returnObjects: true }) as string[])[2]}</span>
                  </div>
                </div>
              </div>

              <div className="lg:w-2/3 grid md:grid-cols-2 gap-6 relative z-10">
                {/* Column 1 */}
                <div className="bg-gradient-to-b from-[#f0faf4]/50 to-white rounded-3xl p-6 md:p-8 border border-[#a7e8c3]/40 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 text-[var(--womb-forest)]"><Activity className="w-5 h-5" /></div>
                    <h4 className="font-extrabold text-gray-900 text-lg">{t('flagship.integratedSchoolHealth.col1Title')}</h4>
                  </div>
                  <ul className="space-y-4">
                    {(t('flagship.integratedSchoolHealth.col1Items', { returnObjects: true }) as string[]).map((item, i) => (
                      <li key={i} className="flex items-start gap-3 group/li">
                        <div className="mt-1 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 group-hover/li:bg-[var(--womb-forest)] transition-colors"><CheckCircle className="w-3 h-3 text-[var(--womb-forest)] group-hover/li:text-white transition-colors" /></div>
                        <span className="text-[0.9rem] text-gray-700 font-medium leading-snug group-hover/li:text-gray-900 transition-colors">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2 */}
                <div className="bg-gradient-to-b from-[#f4f7fe]/50 to-white rounded-3xl p-6 md:p-8 border border-blue-200/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 mt-6 md:mt-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 text-blue-600"><Leaf className="w-5 h-5" /></div>
                    <h4 className="font-extrabold text-gray-900 text-lg">{t('flagship.integratedSchoolHealth.col2Title')}</h4>
                  </div>
                  <ul className="space-y-4">
                    {(t('flagship.integratedSchoolHealth.col2Items', { returnObjects: true }) as string[]).map((item, i) => (
                      <li key={i} className="flex items-start gap-3 group/li">
                        <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 group-hover/li:bg-blue-600 transition-colors"><CheckCircle className="w-3 h-3 text-blue-600 group-hover/li:text-white transition-colors" /></div>
                        <span className="text-[0.9rem] text-gray-700 font-medium leading-snug group-hover/li:text-gray-900 transition-colors">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Vaccine Reminder Programme - 9 Touchpoint Timeline */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12 lg:mb-16"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 shadow-inner flex items-center justify-center mb-6 shrink-0 relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                <Syringe className="w-8 h-8 text-indigo-600 relative z-10" />
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight"><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{t('flagship.vaccineReminder.title1')}</span>{t('flagship.vaccineReminder.title2')}</h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto font-medium leading-relaxed">
                {t('flagship.vaccineReminder.desc1')}<strong className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold text-[0.95em]">{t('flagship.vaccineReminder.descStrong')}</strong>{t('flagship.vaccineReminder.desc2')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative z-10 perspective-[1000px]">
              {/* Channel 1: SMS */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -40, rotateY: -5 }}
                whileInView={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 50 }}
                className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_50px_-15px_rgba(139,92,246,0.15)] hover:border-purple-200 transition-all duration-500 group relative overflow-hidden flex flex-col h-full transform-gpu hover:-translate-y-2"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-purple-600 font-black text-2xl tracking-tight">SMS</span>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-50 w-max px-2 py-0.5 rounded-md mt-1">{t('flagship.vaccineReminder.remindersCount')}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-6 relative z-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-purple-100 before:via-purple-200 before:to-purple-100 mt-2">
                  <div className="relative pl-8 group/item">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-purple-200 z-10 group-hover/item:border-purple-400 transition-colors" />
                    <p className="font-extrabold text-gray-900 text-[0.95rem] mb-0.5">{t('flagship.vaccineReminder.timeline.before')}</p>
                    <p className="text-gray-500 text-sm font-medium">{t('flagship.vaccineReminder.timeline.beforeDesc')}</p>
                  </div>
                  <div className="relative pl-8 group/item">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)] border-4 border-white z-10 group-hover/item:scale-110 transition-transform" />
                    <p className="font-extrabold text-purple-700 text-[0.95rem] mb-0.5">{t('flagship.vaccineReminder.timeline.due')}</p>
                    <p className="text-gray-500 text-sm font-medium">{t('flagship.vaccineReminder.timeline.dueDesc')}</p>
                  </div>
                  <div className="relative pl-8 group/item">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-purple-200 z-10 group-hover/item:border-purple-400 transition-colors" />
                    <p className="font-extrabold text-gray-900 text-[0.95rem] mb-0.5">{t('flagship.vaccineReminder.timeline.after')}</p>
                    <p className="text-gray-500 text-sm font-medium">{t('flagship.vaccineReminder.timeline.afterDesc')}</p>
                  </div>
                </div>
              </motion.div>

              {/* Channel 2: WhatsApp */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -40, rotateY: 0 }}
                whileInView={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 50 }}
                className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_50px_-15px_rgba(34,197,94,0.15)] hover:border-emerald-200 transition-all duration-500 group relative overflow-hidden flex flex-col h-full transform-gpu hover:-translate-y-2"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-emerald-600 font-black text-2xl tracking-tight">WhatsApp</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 w-max px-2 py-0.5 rounded-md mt-1">{t('flagship.vaccineReminder.remindersCount')}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                    <Smartphone className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-6 relative z-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-emerald-100 before:via-emerald-200 before:to-emerald-100 mt-2">
                  <div className="relative pl-8 group/item">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-emerald-200 z-10 group-hover/item:border-emerald-400 transition-colors" />
                    <p className="font-extrabold text-gray-900 text-[0.95rem] mb-0.5">{t('flagship.vaccineReminder.timeline.before')}</p>
                    <p className="text-gray-500 text-sm font-medium">{t('flagship.vaccineReminder.timeline.beforeDesc')}</p>
                  </div>
                  <div className="relative pl-8 group/item">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] border-4 border-white z-10 group-hover/item:scale-110 transition-transform" />
                    <p className="font-extrabold text-emerald-700 text-[0.95rem] mb-0.5">{t('flagship.vaccineReminder.timeline.due')}</p>
                    <p className="text-gray-500 text-sm font-medium">{t('flagship.vaccineReminder.timeline.dueDesc')}</p>
                  </div>
                  <div className="relative pl-8 group/item">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-emerald-200 z-10 group-hover/item:border-emerald-400 transition-colors" />
                    <p className="font-extrabold text-gray-900 text-[0.95rem] mb-0.5">{t('flagship.vaccineReminder.timeline.after')}</p>
                    <p className="text-gray-500 text-sm font-medium">{t('flagship.vaccineReminder.timeline.afterDesc')}</p>
                  </div>
                </div>
              </motion.div>

              {/* Channel 3: Email */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -40, rotateY: 5 }}
                whileInView={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: 0.3, type: "spring", stiffness: 50 }}
                className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_50px_-15px_rgba(245,158,11,0.15)] hover:border-amber-200 transition-all duration-500 group relative overflow-hidden flex flex-col h-full transform-gpu hover:-translate-y-2"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-amber-600 font-black text-2xl tracking-tight">Email</span>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-50 w-max px-2 py-0.5 rounded-md mt-1">{t('flagship.vaccineReminder.remindersCount')}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                    <Mail className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-6 relative z-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-amber-100 before:via-amber-200 before:to-amber-100 mt-2">
                  <div className="relative pl-8 group/item">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-amber-200 z-10 group-hover/item:border-amber-400 transition-colors" />
                    <p className="font-extrabold text-gray-900 text-[0.95rem] mb-0.5">{t('flagship.vaccineReminder.timeline.before')}</p>
                    <p className="text-gray-500 text-sm font-medium">{t('flagship.vaccineReminder.timeline.beforeDesc')}</p>
                  </div>
                  <div className="relative pl-8 group/item">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)] border-4 border-white z-10 group-hover/item:scale-110 transition-transform" />
                    <p className="font-extrabold text-amber-700 text-[0.95rem] mb-0.5">{t('flagship.vaccineReminder.timeline.due')}</p>
                    <p className="text-gray-500 text-sm font-medium">{t('flagship.vaccineReminder.timeline.dueDesc')}</p>
                  </div>
                  <div className="relative pl-8 group/item">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-4 border-amber-200 z-10 group-hover/item:border-amber-400 transition-colors" />
                    <p className="font-extrabold text-gray-900 text-[0.95rem] mb-0.5">{t('flagship.vaccineReminder.timeline.after')}</p>
                    <p className="text-gray-500 text-sm font-medium">{t('flagship.vaccineReminder.timeline.afterDesc')}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== EMERGENCY PREPAREDNESS & RESILIENCE ==================== */}
      {/* ==================== EMERGENCY PREPAREDNESS & RESILIENCE ==================== */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-white via-orange-50/30 to-rose-50/40 relative overflow-hidden">
        {/* Light background accents */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,_#f97316_0%,_transparent_70%)] opacity-[0.04] blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,_#ef4444_0%,_transparent_70%)] opacity-[0.03] blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#f97316_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Top: Header + Description */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, type: "spring" }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="border-orange-300 text-orange-600 mb-5 bg-orange-50 px-4 py-1.5 tracking-widest font-bold text-[10px] uppercase shadow-sm inline-flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {t('emergency.badge')}
            </Badge>
            <h2 className="text-3xl lg:text-[2.75rem] text-gray-900 mb-4 font-black leading-[1.1] tracking-tight">
              {t('emergency.title1')}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-rose-500">{t('emergency.title2')}</span>
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('emergency.desc1')}<strong className="text-gray-900 font-semibold">{t('emergency.descStrong1')}</strong>, <strong className="text-gray-900 font-semibold">{t('emergency.descStrong2')}</strong>{t('emergency.desc2')}
            </p>
          </motion.div>

          {/* Main Grid: 4 Feature Cards + Delivered By Panel */}
          <div className="grid lg:grid-cols-5 gap-6 items-stretch">
            {/* Left: 4 Feature Cards in 2x2 grid */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="lg:col-span-3 grid sm:grid-cols-2 gap-4"
            >
              {(t('emergency.cards', { returnObjects: true }) as any[]).map((cardItem, idx) => {
                const arr = [
                  { icon: ShieldAlert, color: "bg-red-50", border: "border-red-100", iconBg: "bg-red-100", iconColor: "text-red-500", hoverBorder: "hover:border-red-300" },
                  { icon: Flame, color: "bg-orange-50", border: "border-orange-100", iconBg: "bg-orange-100", iconColor: "text-orange-500", hoverBorder: "hover:border-orange-300" },
                  { icon: Brain, color: "bg-purple-50", border: "border-purple-100", iconBg: "bg-purple-100", iconColor: "text-purple-500", hoverBorder: "hover:border-purple-300" },
                  { icon: Radio, priorityColor: "bg-blue-50", color: "bg-blue-50", border: "border-blue-100", iconBg: "bg-blue-100", iconColor: "text-blue-500", hoverBorder: "hover:border-blue-300" },
                ];
                const item = { ...arr[idx], title: cardItem.title, desc: cardItem.desc };
                return item;
              }).map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={{ hidden: { opacity: 0, y: 30, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                  transition={{ type: "spring", stiffness: 60, damping: 15 }}
                  className="group"
                >
                  <div className={`h-full ${item.color} border ${item.border} ${item.hoverBorder} rounded-2xl p-5 transition-all duration-500 hover:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] group-hover:-translate-y-1`}>
                    <motion.div
                      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center mb-3 shadow-sm`}
                    >
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </motion.div>
                    <h4 className="font-bold text-gray-900 text-[0.95rem] mb-1.5 tracking-tight group-hover:text-orange-600 transition-colors duration-300">{item.title}</h4>
                    <p className="text-[0.8rem] text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Right: Delivered by Real Heroes Panel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
              className="lg:col-span-2"
            >
              <div className="h-full bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_50px_-15px_rgba(249,115,22,0.1)] transition-all duration-500 flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    animate={{ rotate: [0, 3, -3, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 border border-orange-200 flex items-center justify-center shadow-sm"
                  >
                    <Shield className="w-6 h-6 text-orange-600" />
                  </motion.div>
                  <div>
                    <h3 className="text-gray-900 font-extrabold text-lg tracking-tight leading-tight">{t('emergency.heroes.title')}</h3>
                    <p className="text-orange-500 text-[10px] font-bold uppercase tracking-widest">{t('emergency.heroes.badge')}</p>
                  </div>
                </div>

                {/* Partners */}
                <div className="space-y-3 flex-1">
                  {(t('emergency.heroes.partners', { returnObjects: true }) as any[]).map((partner, i) => (
                    <motion.div
                      key={partner.name}
                      initial={{ opacity: 0, x: 15 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.08, type: "spring" }}
                      className="flex items-start gap-2.5 group/p"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-red-400 shrink-0 mt-1.5 group-hover/p:scale-[2] transition-transform duration-300" />
                      <div>
                        <span className="text-gray-900 font-bold text-sm group-hover/p:text-orange-600 transition-colors duration-300">{partner.name}</span>
                        <p className="text-gray-400 text-xs font-medium leading-tight">{partner.role}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Bottom Future Readiness */}
                <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-gray-100">
                  {(t('emergency.heroes.stats', { returnObjects: true }) as any[]).map((stat) => (
                    <div key={stat.title} className="text-center bg-orange-50/50 rounded-lg py-2.5 border border-orange-100/50 hover:bg-orange-100/50 transition-colors">
                      <p className="text-gray-900 font-black text-[0.85rem] leading-none mb-1">{stat.title}</p>
                      <p className="text-orange-500 text-[8px] font-bold uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Go Green & Climate Action */}
      <section className="py-12 lg:py-16 bg-[#0a1410] border-t border-[var(--womb-forest)]/20 relative overflow-hidden min-h-[auto] lg:min-h-[min(90vh,800px)] flex items-center justify-center">
        {/* Animated Background Textures */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--womb-forest)_0%,_transparent_60%)] opacity-[0.08] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_#36c276_0%,_transparent_60%)] opacity-[0.05] rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
              }}
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
                <Badge variant="outline" className="border-[#36c276]/30 text-[#36c276] mb-5 bg-[#36c276]/10 px-4 py-1.5 backdrop-blur-sm tracking-widest font-bold text-[10px] uppercase shadow-[0_0_15px_rgba(54,194,118,0.15)] inline-flex items-center gap-2">
                  <Leaf className="w-3.5 h-3.5" /> {t('goGreen.badge')}
                </Badge>
              </motion.div>

              <motion.h2
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                className="text-[2rem] sm:text-4xl lg:text-5xl text-white mb-5 font-extrabold leading-[1.1] tracking-tight drop-shadow-md"
              >
                {t('goGreen.title1')}<br className="hidden sm:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#36c276] to-[var(--womb-forest)]">{t('goGreen.title2')}</span>
              </motion.h2>

              <motion.p
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="text-[1.05rem] text-gray-300 mb-8 leading-relaxed font-light max-w-xl"
              >
                {t('goGreen.desc1')} <strong className="text-white font-bold bg-[#36c276]/20 px-2 py-0.5 rounded-md border border-[#36c276]/30">{t('goGreen.descStrong')}</strong>.
              </motion.p>

              <div className="space-y-4 mb-8">
                {((t('goGreen.features', { returnObjects: true }) as any[]) || []).map((feature, i) => { const item = { title: feature.title, desc: feature.desc, icon: i === 0 ? CheckCircle : Leaf }; return item; }).map((item, i) => (
                  <motion.div
                    key={item.title}
                    variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } }}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#36c276]/10 border border-[#36c276]/20 flex items-center justify-center shrink-0 group-hover:bg-[#36c276]/20 group-hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(54,194,118,0.1)]">
                      <item.icon className="w-5 h-5 text-[#36c276]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-[1.1rem] mb-0.5 group-hover:text-[#36c276] transition-colors duration-300">{item.title}</h4>
                      <p className="text-[0.9rem] text-gray-400 leading-snug max-w-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Certificate Presentation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: -15, x: 50 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, type: "spring", stiffness: 40 }}
              className="relative perspective-[1200px]"
            >
              {/* Premium Glow Behind Certificate */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#36c276]/30 to-[var(--womb-forest)]/40 blur-[80px] rounded-full scale-90" />

              <div className="relative w-full max-w-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-3 sm:p-4 shadow-[0_30px_70px_rgba(0,0,0,0.6)] group transform-gpu transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(54,194,118,0.2)] mx-auto lg:ml-auto">
                <div className="absolute -inset-[1px] bg-gradient-to-br from-white/30 via-transparent to-[#36c276]/30 rounded-[2rem] pointer-events-none opacity-50" />

                <div className="overflow-hidden rounded-[1.2rem] relative bg-[#f8f9fa] w-full border border-gray-200 shadow-inner group-hover:border-[#36c276]/50 transition-colors duration-500 min-h-[320px] sm:min-h-[420px] lg:min-h-[480px]">
                  <iframe
                    src="/Go%20Green%20Certificate.pdf#view=FitH&toolbar=0&navpanes=0&scrollbar=0"
                    className="hidden sm:block w-full h-[420px] lg:h-[500px] border-none pointer-events-auto mix-blend-multiply scale-100 lg:scale-[1.05]"
                    title={t('goGreen.certificate')}
                  />
                  <a
                    href="/Go%20Green%20Certificate.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sm:hidden absolute inset-0 block bg-[#f8f9fa]"
                  >
                    <div className="absolute inset-x-0 top-0 bottom-[68px] overflow-hidden">
                      <MobilePdfPreview
                        pdfUrl="/Go%20Green%20Certificate.pdf"
                        title={t('goGreen.certificate')}
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-gray-200 bg-[#184f34] px-4 py-3">
                      <div>
                        <p className="text-white font-bold text-[1.02rem] leading-tight">{t('goGreen.certificate')}</p>
                        <p className="text-[#7ce0a6] text-xs font-medium">{t('goGreen.certificateSub')}</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/10 text-white shadow-sm">
                        <ArrowRight className="h-4 w-4 -rotate-45" />
                      </span>
                    </div>
                  </a>

                  {/* Glass Overlay on Hover to prompt interaction */}
                  <a href="/Go%20Green%20Certificate.pdf" target="_blank" rel="noopener noreferrer" className="absolute inset-0 hidden sm:flex bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-500 flex-col items-center justify-center cursor-pointer z-10">
                    <div className="w-14 h-14 rounded-full bg-[#36c276]/90 shadow-[0_0_30px_rgba(54,194,118,0.6)] flex items-center justify-center mb-4 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500 ease-out border border-[#36c276]/50">
                      <ArrowRight className="w-6 h-6 text-white transform -rotate-45" />
                    </div>
                    <p className="text-white font-bold tracking-widest uppercase text-xs transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500 delay-75 ease-out shadow-black">{t('goGreen.viewPdf')}</p>
                  </a>
                </div>

                <div className="mt-5 hidden sm:flex items-start justify-between px-2 gap-3">
                  <div>
                    <p className="text-white font-bold text-[1.05rem] leading-tight mb-1">{t('goGreen.certificate')}</p>
                    <p className="text-[#36c276] text-xs font-medium">{t('goGreen.certificateSub')}</p>
                  </div>
                  <a href="/Go%20Green%20Certificate.pdf" download="WombTo18_Go_Green_Certificate.pdf" className="h-10 w-10 rounded-xl bg-white/10 hover:bg-[#36c276] flex items-center justify-center transition-all duration-300 border border-white/10 backdrop-blur-md shrink-0 focus:ring-2 ring-[#36c276]/50 outline-none">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </a>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Vision for Impact */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-white to-gray-50/50">
        {/* Animated Background Elements for Cinematic Feel */}
        <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--womb-forest)_0%,_transparent_70%)] opacity-[0.03] blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--journey-saffron)_0%,_transparent_70%)] opacity-[0.03] blur-[80px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-20"
          >
            <p className="inline-flex items-center gap-2 bg-[var(--journey-saffron)]/10 text-[var(--journey-saffron)] px-5 py-2.5 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase border border-[var(--journey-saffron)]/20 mb-6 shadow-sm">
              {t('vision.badge')}
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-5 tracking-tight drop-shadow-sm">{t('vision.title')}</h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">{t('vision.desc')}</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connecting subtle line behind cards */}
            <div className="hidden md:block absolute top-[40%] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent z-0" />

            {((t('vision.cards', { returnObjects: true }) as any[]) || []).map((card, idx) => { const item = { title: card.title, desc: card.desc, icon: idx === 0 ? Shield : idx === 1 ? Target : HeartPulse }; return item; }).map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: i * 0.15, type: "spring", stiffness: 60, damping: 15 }}
                className="relative z-10 group perspective-[1000px] h-full"
              >
                {/* Subtle glow behind card */}
                <div className="absolute -inset-1 bg-gradient-to-br from-[var(--womb-forest)]/10 to-[var(--journey-saffron)]/10 rounded-[1.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <Card className="bg-white/95 backdrop-blur-xl border border-white/50 text-center shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_50px_-15px_rgba(29,110,63,0.1)] transition-all duration-500 rounded-3xl h-full overflow-hidden transform-gpu group-hover:-translate-y-1.5 relative flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--womb-forest)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-x-0 group-hover:scale-x-100 origin-center ease-out" />

                  <CardContent className="pt-10 pb-8 px-6 relative flex-1 flex flex-col items-center">
                    {/* Animated Icon Container */}
                    <motion.div
                      initial={{ y: 0 }}
                      animate={{ y: [-3, 3, -3] }}
                      transition={{ duration: 4, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f0faf4] to-white border border-[#a7e8c3]/40 flex items-center justify-center mb-6 shrink-0 group-hover:scale-110 group-hover:bg-[var(--womb-forest)]/10 group-hover:border-[var(--womb-forest)]/30 group-hover:shadow-[0_10px_20px_rgba(29,110,63,0.1)] transition-all duration-500"
                    >
                      <item.icon className="w-8 h-8 text-[var(--womb-forest)]" />
                    </motion.div>

                    <h3 className="text-[1.35rem] text-gray-900 font-extrabold mb-4 group-hover:text-[var(--womb-forest)] transition-colors duration-300 tracking-tight">
                      {item.title}
                    </h3>

                    <div className="w-10 h-[3px] bg-gray-200 rounded-full mb-4 group-hover:w-16 group-hover:bg-[var(--womb-forest)]/40 transition-all duration-500" />

                    <p className="text-[0.95rem] text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <UpcomingCampsSection />
      {/* CTA */}
      <section className="py-24 bg-white border-t border-gray-100 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--journey-saffron)_0%,_transparent_60%)] opacity-[0.05] rounded-full blur-[80px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-[var(--womb-forest)] to-[#155e33] rounded-[3rem] p-12 md:p-16 lg:p-20 shadow-[0_20px_50px_-15px_rgba(29,110,63,0.4)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl text-white mb-6 font-extrabold tracking-tight">{t('cta.title')}</h2>
              <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto leading-relaxed">
                {t('cta.desc')}
              </p>
              <Link to="/donate">
                <Button size="lg" className="bg-white hover:bg-green-50 text-[var(--womb-forest)] h-14 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-base font-extrabold group">
                  {t('cta.btn')} <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
