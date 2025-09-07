import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, ClipboardPaste, FileText, Sparkles } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface PlagiarismResult {
  percentage: number;
  originality: number;
  sameSentences: number;
  similarSentences: number;
  uniqueSentences: number;
  risk: 'Tinggi' | 'Sedang' | 'Rendah';
  highlightedTextB: JSX.Element;
}

/* Utilities */
const wordCount = (text: string): number =>
  text ? text.trim().split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length : 0;
const charCount = (text: string): number => (text ? [...text].length : 0);
const splitIntoSentences = (t: string) => t.split(/[.!?]+\s+/).map(s=>s.trim()).filter(Boolean);
const sentenceSimilarity = (a: string, b: string) => {
  const A = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const B = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  const inter = new Set([...A].filter(x => B.has(x)));
  const denom = A.size + B.size;
  return denom ? (inter.size * 2) / denom : 0;
};
const calcSimilarity = (src: string, tgt: string): PlagiarismResult => {
  const A = splitIntoSentences(src), B = splitIntoSentences(tgt);
  let same = 0, similar = 0, unique = 0;
  const highlighted: JSX.Element[] = [];
  B.forEach((b, i) => {
    let maxSim = 0;
    for (const a of A) { const s = sentenceSimilarity(a,b); if (s>maxSim) maxSim=s; if (maxSim===1) break; }
    if (maxSim >= 0.8) { same++;   highlighted.push(<span key={i} className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md">{b}.</span>); }
    else if (maxSim >= 0.5) { similar++; highlighted.push(<span key={i} className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md">{b}.</span>); }
    else { unique++; highlighted.push(<span key={i} className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md">{b}.</span>); }
    highlighted.push(<span key={`sp-${i}`}> </span>);
  });
  const total = same + similar + unique;
  const pct = total ? Math.round(((same+similar)/total)*100) : 0;
  const originality = Math.max(0, 100 - pct);
  const risk: PlagiarismResult['risk'] = pct >= 80 ? 'Tinggi' : pct >= 50 ? 'Sedang' : 'Rendah';
  return { percentage: pct, originality, sameSentences: same, similarSentences: similar, uniqueSentences: unique, risk,
    highlightedTextB: <p className="leading-relaxed flex flex-wrap gap-1">{highlighted}</p> };
};

/* Component */
const PlagiarismChecker: React.FC = () => {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const words = useMemo(() => ['Tercepat', 'Termudah', 'Teraman'], []);
  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => { const id = setInterval(()=>setWordIndex(i=>(i+1)%words.length), 2200); return ()=>clearInterval(id); }, [words.length]);

  const result = useMemo(() => (textA && textB ? calcSimilarity(textA, textB) : null), [textA, textB]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const pasteSamples = () => {
    setTextA('Pembelajaran mesin adalah cabang kecerdasan buatan yang berfokus pada pengembangan algoritma yang dapat belajar dari data. Teknik ini memungkinkan sistem untuk meningkatkan kinerja tanpa diprogram secara eksplisit.');
    setTextB('Machine learning merupakan bagian dari AI yang menggunakan data untuk melatih model, sehingga performanya meningkat dari waktu ke waktu tanpa aturan yang ditulis manual.');
    scrollTo('results');
  };

  const getRiskColor = (risk: PlagiarismResult['risk']) =>
    risk === 'Tinggi' ? 'bg-red-100 text-red-700 border-red-300'
    : risk === 'Sedang' ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
    : 'bg-green-100 text-green-700 border-green-300';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'bg-white/90 backdrop-blur shadow' : 'bg-gradient-to-r from-emerald-600 to-teal-600'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <span className={`p-2.5 rounded-lg shadow ${scrolled ? 'bg-emerald-600' : 'bg-white'}`}>
              <FileText className={`h-6 w-6 ${scrolled ? 'text-white' : 'text-emerald-600'}`} />
            </span>
            <span className={`font-semibold ${scrolled ? 'text-gray-800' : 'text-white'} text-lg md:text-xl`}>
              Plagiarism Checker
            </span>
          </div>
          <nav className={`hidden md:flex items-center gap-8 ${scrolled ? 'text-gray-700' : 'text-emerald-100'} text-base`}>
            <button onClick={() => scrollTo('hero')} className="hover:opacity-80">Beranda</button>
            <button onClick={() => scrollTo('results')} className="hover:opacity-80">Hasil</button>
          </nav>
        </div>
      </header>

      {/* HERO + INPUT */}
      <section id="hero" className="min-h-screen flex items-center relative pt-28 pb-14">
        <div className="pointer-events-none absolute -top-24 -right-20 h-96 w-96 bg-emerald-200 rounded-full blur-3xl opacity-40" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-96 w-96 bg-teal-200 rounded-full blur-3xl opacity-40" />

        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Copy kiri — BESAR */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-sm font-medium text-emerald-700 shadow-sm">
              <Sparkles className="h-5 w-5" /> Deteksi Cepat • Highlight Cerdas • Lokal & Aman
            </div>

            <h1 className="mt-6 text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Deteksi Plagiarisme{' '}
              <span className="relative inline-block align-baseline">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={words[wordIndex]}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    whileHover={{ scale: 1.07 }}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm"
                    title={`Fokus pada ${words[wordIndex].toLowerCase()}`}
                  >
                    {words[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>

            <p className="mt-5 text-gray-600 max-w-2xl lg:mx-0 mx-auto text-lg">
              Periksa keaslian teks Anda dalam hitungan detik tanpa ribet. 
              Sistem kami secara otomatis akan menyoroti kalimat yang sama, mirip, atau berbeda secara jelas. 
            </p>

            <div className="mt-7 flex flex-col sm:flex-row lg:justify-start justify-center gap-4">
              <button
                onClick={() => scrollTo('results')}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-white font-semibold shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all text-lg"
              >
                <Check className="h-6 w-6" /> Lihat Hasil di Bawah
              </button>
              <button
                onClick={pasteSamples}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-gray-800 font-semibold border border-gray-200 shadow-sm hover:shadow-md transition-all text-lg"
              >
                <ClipboardPaste className="h-6 w-6" /> Gunakan Contoh
              </button>
            </div>
          </div>

          {/* Kartu input kanan */}
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-200 p-6 lg:p-8 lg:max-w-[640px] justify-self-end w-full">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Teks Referensi</label>
                <textarea
                  value={textA}
                  onChange={(e) => setTextA(e.target.value)}
                  placeholder="Masukkan teks referensi..."
                  className="w-full h-52 p-4 font-mono text-sm bg-gray-50 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="mt-1 text-xs text-gray-500">
                  {wordCount(textA)} kata • {charCount(textA)} karakter
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Teks Jawaban</label>
                <textarea
                  value={textB}
                  onChange={(e) => setTextB(e.target.value)}
                  placeholder="Masukkan teks yang akan dibandingkan..."
                  className="w-full h-52 p-4 font-mono text-sm bg-gray-50 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="mt-1 text-xs text-gray-500">
                  {wordCount(textB)} kata • {charCount(textB)} karakter
                </div>
              </div>

              <button
                onClick={() => scrollTo('results')}
                className="w-full inline-flex items-center justify-center px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-emerald-700 transition-all text-base"
              >
                <Check className="h-5 w-5 mr-2" /> Cek Plagiarisme
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RESULT */}
      <section id="results" className="min-h-[80vh] py-14 bg-white">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 md:p-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Hasil Analisis</h2>
            {!textA || !textB ? (
              <p className="text-gray-500 text-lg">Masukkan kedua teks pada kotak input di atas untuk melihat hasil.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 text-center">
                  <div className="p-5 bg-emerald-50 rounded-xl shadow-sm">
                    <div className="text-3xl font-extrabold text-emerald-700">{result?.percentage ?? 0}%</div>
                    <div className="text-sm text-gray-600">Similarity</div>
                  </div>
                  <div className="p-5 bg-green-50 rounded-xl shadow-sm">
                    <div className="text-3xl font-extrabold text-green-700">{result?.originality ?? 100}%</div>
                    <div className="text-sm text-gray-600">Originality</div>
                  </div>
                  <div className="p-5 bg-red-50 rounded-xl shadow-sm">
                    <div className="text-xl font-bold text-red-700">{result?.sameSentences ?? 0}</div>
                    <div className="text-sm text-gray-600">Kalimat Sama</div>
                  </div>
                  <div className="p-5 bg-yellow-50 rounded-xl shadow-sm">
                    <div className="text-xl font-bold text-yellow-700">{result?.similarSentences ?? 0}</div>
                    <div className="text-sm text-gray-600">Kalimat Mirip</div>
                  </div>
                  <div className="p-5 bg-green-50 rounded-xl shadow-sm">
                    <div className="text-xl font-bold text-green-700">{result?.uniqueSentences ?? 0}</div>
                    <div className="text-sm text-gray-600">Kalimat Unik</div>
                  </div>
                  <div className={`p-5 rounded-xl shadow-sm border ${getRiskColor(result?.risk || 'Rendah')}`}>
                    <div className="flex justify-center items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      <div className="text-lg font-bold">{result?.risk || 'Rendah'}</div>
                    </div>
                    <div className="text-sm">Risk Level</div>
                  </div>
                </div>

                <div className="mt-10">
                  <h3 className="font-semibold text-gray-800 mb-3 text-lg">Analisis Teks Jawaban</h3>
                  <div className="text-gray-700 bg-gray-50 p-5 rounded-xl border border-gray-200 min-h-[140px]">
                    {result?.highlightedTextB}
                  </div>
                  <p className="text-sm text-gray-500 mt-3 space-x-2">
                    <span className="bg-red-100 text-red-700 px-1.5 rounded">Merah = Sama</span>
                    <span className="bg-yellow-100 text-yellow-700 px-1.5 rounded">Kuning = Mirip</span>
                    <span className="bg-green-100 text-green-700 px-1.5 rounded">Hijau = Unik</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-7 text-center text-gray-400 text-sm">
          © 2025 Plagiarism Checker — Beta Version
        </div>
      </footer>
    </div>
  );
};

export default PlagiarismChecker;
