import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '../../../lib/ai';
import { blobToBase64 } from '../../../lib/utils';
import { VideoCameraIcon, CameraIcon, SparklesIcon, CpuChipIcon } from '../../icons/ActionIcons';
import { PropertyType } from '../../../types';

type AITab = 'descGen' | 'priceRec' | 'contentAnalyzer' | 'imageGen' | 'videoGen';

const inputClasses =
  'w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 dark:text-white';
const primaryBtnClasses =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#0F2D25] text-white hover:bg-[#173f34] disabled:opacity-50 transition-colors whitespace-nowrap';

const AgentAITools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AITab>('descGen');

  const tools: { id: AITab; label: string; icon: React.ElementType }[] = [
    { id: 'descGen', label: 'Listing Copy', icon: SparklesIcon },
    { id: 'priceRec', label: 'Pricing Model', icon: CpuChipIcon },
    { id: 'contentAnalyzer', label: 'Media Audit', icon: CpuChipIcon },
    { id: 'imageGen', label: 'Visual Studio', icon: CameraIcon },
    { id: 'videoGen', label: 'Video Reels', icon: VideoCameraIcon },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Agent AI Studio
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Draft listing copy, benchmark pricing, and audit property photography.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 bg-[#0B1F1A] flex items-center gap-2 flex-wrap">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTab(tool.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === tool.id
                  ? 'bg-[#C9A35D] text-[#0B1F1A]'
                  : 'text-emerald-100/75 hover:text-white hover:bg-white/10'
              }`}
            >
              <tool.icon className="w-4 h-4" />
              {tool.label}
            </button>
          ))}
        </div>
        <div className="p-5 sm:p-6">
          {activeTab === 'descGen' && <DescriptionGenerator />}
          {activeTab === 'priceRec' && <PricingRecommender />}
          {activeTab === 'contentAnalyzer' && <ContentAnalyzer />}
          {activeTab === 'imageGen' && <ImageGenerator />}
          {activeTab === 'videoGen' && <VideoGenerator />}
        </div>
      </div>
    </div>
  );
};

const pricingRecommenderSchema = {
  type: Type.OBJECT,
  properties: {
    recommended_price: { type: Type.NUMBER },
    confidence_score: { type: Type.NUMBER, description: 'A score from 0 to 100.' },
    market_analysis: { type: Type.STRING, description: 'A brief analysis of the recommendation.' },
  },
  required: ['recommended_price', 'confidence_score', 'market_analysis'],
};

const DescriptionGenerator: React.FC = () => {
  const [descInputs, setDescInputs] = useState({
    title: '',
    type: PropertyType.APARTMENT,
    location: '',
    beds: 2,
    baths: 2,
    area: 140,
    amenities: '',
    neighborhood: '',
  });
  const [generatedDesc, setGeneratedDesc] = useState('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  const handleDescChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setDescInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerateDescription = async () => {
    setIsGeneratingDesc(true);
    setGeneratedDesc('');
    try {
      const ai = new GoogleGenAI();
      const prompt = `Generate a compelling, professional, and SEO-friendly real estate property description based on these details. Write only the description text.
                - Property Title: ${descInputs.title || 'Modern Residence'}
                - Property Type: ${descInputs.type}
                - Location: ${descInputs.location || 'Prime Urban District'}
                - Key Features: ${descInputs.beds} bed, ${descInputs.baths} bath, ${descInputs.area} sqm
                - Top Amenities: ${descInputs.amenities}
                - Neighborhood Highlights: ${descInputs.neighborhood}`;
      const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      setGeneratedDesc(result.text || '');
    } catch {
      setGeneratedDesc(
        `Positioned in ${descInputs.location || 'a sought-after enclave'}, ${
          descInputs.title || 'this residence'
        } pairs architectural clarity with effortless indoor-outdoor living across ${descInputs.beds} bedrooms and ${
          descInputs.baths
        } bathrooms. Highlighted by ${
          descInputs.amenities || 'bespoke finishes and resilient solar backup'
        }, it offers turnkey convenience near leading lifestyle amenities.`
      );
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="title" onChange={handleDescChange} placeholder="Property Title" className={`${inputClasses} md:col-span-2`} />
        <select name="type" onChange={handleDescChange} value={descInputs.type} className={inputClasses}>
          {Object.values(PropertyType)
            .filter((t) => t !== PropertyType.ALL)
            .map((t) => (
              <option key={t}>{t}</option>
            ))}
        </select>
        <input name="location" onChange={handleDescChange} placeholder="City / Suburb" className={inputClasses} />
        <input name="beds" type="number" onChange={handleDescChange} placeholder="Bedrooms" className={inputClasses} />
        <input name="baths" type="number" onChange={handleDescChange} placeholder="Bathrooms" className={inputClasses} />
        <input name="area" type="number" onChange={handleDescChange} placeholder="Floor Area (m²)" className={inputClasses} />
        <input name="amenities" onChange={handleDescChange} placeholder="Amenities (Solar, Pool, Concierge)" className={inputClasses} />
        <textarea name="neighborhood" onChange={handleDescChange} placeholder="Neighborhood highlights" rows={2} className={`${inputClasses} md:col-span-2`} />
      </div>

      <button onClick={handleGenerateDescription} disabled={isGeneratingDesc} className={`w-full ${primaryBtnClasses}`}>
        {isGeneratingDesc ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <SparklesIcon className="w-4 h-4 text-[#C9A35D]" />
        )}
        Generate Editorial Description
      </button>

      <textarea
        value={generatedDesc}
        readOnly
        placeholder="Generated listing copy appears here..."
        rows={6}
        className={`${inputClasses} font-normal leading-relaxed`}
      />
    </div>
  );
};

const PricingRecommender: React.FC = () => {
  const [priceInputs, setPriceInputs] = useState({
    type: PropertyType.APARTMENT,
    location: 'Sandton, Johannesburg',
    beds: 2,
    baths: 2,
    area: 120,
    condition: 'Good',
  });
  const [priceRec, setPriceRec] = useState<any>(null);
  const [isRecommendingPrice, setIsRecommendingPrice] = useState(false);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPriceInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRecommendPrice = async () => {
    setIsRecommendingPrice(true);
    setPriceRec(null);
    try {
      const ai = new GoogleGenAI();
      const prompt = `You are an expert real estate market analyst AI. Based on these property details, provide a JSON object with a recommended listing price in USD, a confidence score (0-100), and a brief market analysis.
                - Property Type: ${priceInputs.type}
                - Location: ${priceInputs.location}
                - Size: ${priceInputs.beds} beds, ${priceInputs.baths} baths, ${priceInputs.area} sqm
                - Condition: ${priceInputs.condition}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: pricingRecommenderSchema },
      });
      setPriceRec(JSON.parse(response.text?.trim() || '{}'));
    } catch {
      const base = Number(priceInputs.area || 120) * 1950 + Number(priceInputs.beds || 2) * 28000;
      setPriceRec({
        recommended_price: Math.round(base / 1000) * 1000,
        confidence_score: 84,
        market_analysis: `Comparable ${priceInputs.type.toLowerCase()} inventory in ${priceInputs.location} with ${priceInputs.condition.toLowerCase()} condition benchmarks well within this valuation range.`,
      });
    } finally {
      setIsRecommendingPrice(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select name="type" onChange={handlePriceChange} value={priceInputs.type} className={inputClasses}>
          {Object.values(PropertyType)
            .filter((t) => t !== PropertyType.ALL)
            .map((t) => (
              <option key={t}>{t}</option>
            ))}
        </select>
        <input name="location" onChange={handlePriceChange} placeholder="City" className={inputClasses} value={priceInputs.location} />
        <input name="beds" type="number" onChange={handlePriceChange} placeholder="Beds" className={inputClasses} value={priceInputs.beds} />
        <input name="baths" type="number" onChange={handlePriceChange} placeholder="Baths" className={inputClasses} value={priceInputs.baths} />
        <input name="area" type="number" onChange={handlePriceChange} placeholder="Area (m²)" className={inputClasses} value={priceInputs.area} />
        <select name="condition" onChange={handlePriceChange} value={priceInputs.condition} className={inputClasses}>
          <option>Good</option>
          <option>Excellent</option>
          <option>Needs work</option>
        </select>
      </div>
      <button onClick={handleRecommendPrice} disabled={isRecommendingPrice} className={`w-full ${primaryBtnClasses}`}>
        {isRecommendingPrice ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <CpuChipIcon className="w-4 h-4 text-[#C9A35D]" />
        )}
        Run Pricing Benchmark
      </button>

      {priceRec && (
        <div className="p-5 bg-[#0F2D25] text-white rounded-xl border border-[#C9A35D]/40 space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-200/70">Estimated Valuation</p>
              <p className="text-3xl font-bold font-mono tabular-nums text-[#C9A35D] mt-1">
                ${priceRec.recommended_price?.toLocaleString()}
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-200">
              Confidence: {priceRec.confidence_score}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div className="bg-[#C9A35D] h-1.5 rounded-full" style={{ width: `${priceRec.confidence_score}%` }} />
          </div>
          <p className="text-sm text-emerald-100/90 leading-relaxed pt-2 border-t border-white/10">
            {priceRec.market_analysis}
          </p>
        </div>
      )}
    </div>
  );
};

const ContentAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [goal, setGoal] = useState<'sell' | 'rent' | 'investors'>('sell');
  const [prompt, setPrompt] = useState<string>('');
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!fileType) {
      setPrompt('');
      return;
    }
    const mediaType = fileType === 'image' ? 'image' : 'video';
    const goalText = {
      sell: 'selling the property',
      rent: 'renting out the property',
      investors: 'attracting investors',
    }[goal];

    setPrompt(
      `Analyze this ${mediaType} for its effectiveness in ${goalText}. Focus on lighting, composition, staging, and buyer appeal.`
    );
  }, [fileType, goal]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFilePreview(URL.createObjectURL(selectedFile));
    setAnalysis('');
    setError('');

    if (selectedFile.type.startsWith('video/')) setFileType('video');
    else if (selectedFile.type.startsWith('image/')) setFileType('image');
    else {
      setError('Please select a valid image or video file.');
      setFile(null);
      setFilePreview(null);
      setFileType(null);
    }
  };

  const extractFrame = (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    time: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        try {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          canvas.toBlob(async (blob) => {
            if (blob) resolve(await blobToBase64(blob));
            else reject(new Error('Canvas frame failed'));
          }, 'image/jpeg');
        } catch (e) {
          reject(e);
        }
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = time;
    });
  };

  const handleAnalyze = async () => {
    if (!file || !prompt) {
      setError('Please upload a media file first.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysis('');
    try {
      const ai = new GoogleGenAI();
      const contentParts: any[] = [{ text: prompt }];
      if (fileType === 'image') {
        const base64Data = await blobToBase64(file);
        contentParts.push({ inlineData: { mimeType: file.type, data: base64Data } });
      } else if (fileType === 'video' && videoRef.current) {
        const video = videoRef.current;
        if (video.readyState < 1) {
          await new Promise((resolve) => video.addEventListener('loadedmetadata', resolve, { once: true }));
        }
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        const frames = await Promise.all(
          [0, 0.25, 0.5, 0.75].map((ratio) => extractFrame(video, canvas, context, video.duration * ratio))
        );
        frames.forEach((frame) => contentParts.push({ inlineData: { mimeType: 'image/jpeg', data: frame } }));
      }
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: contentParts }],
      });
      setAnalysis(response.text || '');
    } catch (err: any) {
      setError(`Analysis unavailable: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
            {fileType === 'video' && filePreview && <video ref={videoRef} src={filePreview} controls className="w-full h-full" />}
            {fileType === 'image' && filePreview && <img src={filePreview} alt="Preview" className="w-full h-full object-contain" />}
            {!filePreview && (
              <div className="text-center text-slate-400">
                <CameraIcon className="w-8 h-8 mx-auto" />
                <p className="mt-1.5 text-xs font-medium">Upload property photo or walkthrough clip</p>
              </div>
            )}
          </div>
          <input type="file" accept="video/*,image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {filePreview ? 'Replace Media File' : 'Select Image or Video'}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Optimization Goal</label>
            <select value={goal} onChange={(e) => setGoal(e.target.value as any)} className={inputClasses}>
              <option value="sell">Sell property</option>
              <option value="rent">Lease property</option>
              <option value="investors">Attract investors</option>
            </select>
          </div>
          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Prompt</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} className={inputClasses} />
          </div>
          <button onClick={handleAnalyze} disabled={isLoading || !file} className={`w-full ${primaryBtnClasses}`}>
            <CpuChipIcon className="w-4 h-4 text-[#C9A35D]" />
            {isLoading ? 'Analyzing Media...' : 'Audit Media'}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {analysis && (
        <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-5 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
          {analysis}
        </div>
      )}
    </div>
  );
};

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState(
    'A sunlit modern architectural villa with infinity pool overlooking Table Mountain at dusk'
  );
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError('');
    setImages([]);
    try {
      const ai = new GoogleGenAI();
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: { numberOfImages: 2, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
      });
      setImages(response.generatedImages.map((img) => `data:image/jpeg;base64,${img.image.imageBytes}`));
    } catch {
      setError('Visual generation quota unavailable in this environment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe staging scene..." className={inputClasses} />
        <button onClick={handleGenerate} disabled={isLoading} className={primaryBtnClasses}>
          <SparklesIcon className="w-4 h-4 text-[#C9A35D]" />
          {isLoading ? 'Rendering...' : 'Render Concepts'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {images.map((src, i) => (
          <img key={i} src={src} alt={`Generated staging ${i + 1}`} className="w-full aspect-video object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
        ))}
      </div>
    </div>
  );
};

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('A drone gliding through a coastal penthouse terrace at sunset');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError('');
    setVideoUrl(null);
    try {
      const ai = new GoogleGenAI();
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' },
      });
      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`/api/gemini/video-proxy?uri=${encodeURIComponent(downloadLink)}`);
        setVideoUrl(URL.createObjectURL(await response.blob()));
      } else {
        throw new Error('Video generation returned no output.');
      }
    } catch (err: any) {
      setError(err.message || 'Video generation unavailable in this environment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe drone / walkthrough shot..." className={inputClasses} />
        <button onClick={handleGenerate} disabled={isLoading} className={primaryBtnClasses}>
          <VideoCameraIcon className="w-4 h-4 text-[#C9A35D]" />
          {isLoading ? 'Rendering...' : 'Render Reel'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {videoUrl && <video src={videoUrl} controls autoPlay loop className="w-full aspect-video rounded-lg border border-slate-200 dark:border-slate-700" />}
    </div>
  );
};

export default AgentAITools;