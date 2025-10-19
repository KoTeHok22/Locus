import React, { useState, useRef } from 'react';
import { Upload, Camera, FileText, CheckCircle, AlertCircle, Loader, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const TTNUpload = ({ projectId, onSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedTTN, setUploadedTTN] = useState(null);
    const [recognitionStatus, setRecognitionStatus] = useState(null);
    const [suggestedProject, setSuggestedProject] = useState(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
                toast.error('Поддерживаются только PDF и изображения');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Выберите файл');
            return;
        }

        setIsUploading(true);
        try {
            const result = await ApiService.recognizeDocument(projectId, selectedFile);
            setUploadedTTN(result);
            toast.success('ТТН загружена. Начато распознавание...');
            
            pollRecognitionStatus(result.document_id);
        } catch (error) {
            toast.error(`Ошибка загрузки: ${error.message}`);
            setIsUploading(false);
        }
    };

    const pollRecognitionStatus = async (ttnId) => {
        const maxAttempts = 30;
        let attempts = 0;

        const checkStatus = async () => {
            try {
                const ttn = await ApiService.getRecognitionStatus(ttnId);
                setRecognitionStatus(ttn.recognition_status);

                if (ttn.recognition_status === 'completed') {
                    setUploadedTTN(ttn);
                    setIsUploading(false);
                    toast.success('Распознавание завершено');
                    
                    if (ttn.delivery_address) {
                        await suggestProjectByAddress(ttnId);
                    }
                } else if (ttn.recognition_status === 'failed') {
                    setIsUploading(false);
                    toast.error('Ошибка распознавания');
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkStatus, 2000);
                } else {
                    setIsUploading(false);
                    toast.error('Превышено время ожидания распознавания');
                }
            } catch (error) {
                setIsUploading(false);
                toast.error(`Ошибка проверки статуса: ${error.message}`);
            }
        };

        checkStatus();
    };

    const suggestProjectByAddress = async (ttnId) => {
        try {
            const suggestion = await ApiService.suggestProjectForTTN(ttnId);
            if (suggestion.suggested_project) {
                setSuggestedProject(suggestion.suggested_project);
            }
        } catch (error) {
            console.error('Ошибка получения предложения проекта:', error);
        }
    };

    const handleVerify = async () => {
        if (!uploadedTTN) return;

        try {
            await ApiService.verifyAndProcessTTN(
                uploadedTTN.id,
                uploadedTTN.recognized_data,
                projectId
            );
            toast.success('ТТН подтверждена и материалы оприходованы');
            setSelectedFile(null);
            setUploadedTTN(null);
            setRecognitionStatus(null);
            setSuggestedProject(null);
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(`Ошибка подтверждения: ${error.message}`);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setUploadedTTN(null);
        setRecognitionStatus(null);
        setSuggestedProject(null);
        setIsUploading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Upload size={20} className="text-blue-600" />
                    Загрузка и распознавание ТТН
                </h3>

                {!uploadedTTN ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FileText size={48} className="text-slate-400" />
                                <span>Выбрать файл</span>
                                {selectedFile && (
                                    <span className="text-xs text-blue-600 font-normal">
                                        {selectedFile.name}
                                    </span>
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <button
                                onClick={() => cameraInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-sm font-semibold text-slate-600 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Camera size={48} className="text-slate-400" />
                                <span>Сфотографировать</span>
                            </button>
                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        {selectedFile && (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader size={16} className="animate-spin" />
                                            Загрузка и распознавание...
                                        </span>
                                    ) : (
                                        'Загрузить и распознать'
                                    )}
                                </button>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    disabled={isUploading}
                                    className="rounded-xl border-2 border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Отмена
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-slate-200 bg-white p-6">
                            <div className="flex items-start justify-between mb-4">
                                <h4 className="text-sm font-semibold text-slate-900">
                                    Результат распознавания
                                </h4>
                                {recognitionStatus === 'completed' && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-semibold">
                                        <CheckCircle size={12} />
                                        Готово
                                    </span>
                                )}
                            </div>

                            {uploadedTTN.recognized_data && (
                                <div className="space-y-3">
                                    {uploadedTTN.recognized_data.number && (
                                        <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                                            <FileText size={16} className="mt-0.5 text-slate-500" />
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500">Номер ТТН</p>
                                                <p className="text-sm font-medium text-slate-900">{uploadedTTN.recognized_data.number}</p>
                                            </div>
                                        </div>
                                    )}
                                    {uploadedTTN.recognized_data.date && (
                                        <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                                            <FileText size={16} className="mt-0.5 text-slate-500" />
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500">Дата</p>
                                                <p className="text-sm font-medium text-slate-900">{uploadedTTN.recognized_data.date}</p>
                                            </div>
                                        </div>
                                    )}
                                    {uploadedTTN.delivery_address && (
                                        <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                                            <MapPin size={16} className="mt-0.5 text-slate-500" />
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500">Адрес доставки</p>
                                                <p className="text-sm font-medium text-slate-900">{uploadedTTN.delivery_address}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {uploadedTTN.items && uploadedTTN.items.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <p className="text-xs font-semibold text-slate-600 uppercase mb-3">Материалы</p>
                                    <div className="space-y-2">
                                        {uploadedTTN.items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                                                <span className="text-sm text-slate-900">{item.material_name}</span>
                                                <span className="text-sm font-semibold text-slate-900">
                                                    {item.quantity} {item.unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {suggestedProject && (
                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                <div className="flex items-start gap-3">
                                    <MapPin size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-blue-900 mb-1">
                                            Предложение по проекту
                                        </p>
                                        <p className="text-sm text-blue-700">
                                            Адрес доставки совпадает с проектом: <span className="font-semibold">{suggestedProject.name}</span>
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            Расстояние: {suggestedProject.distance.toFixed(2)} км
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleVerify}
                                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle size={16} />
                                    Подтвердить и оприходовать
                                </span>
                            </button>
                            <button
                                onClick={handleReset}
                                className="rounded-xl border-2 border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TTNUpload;
