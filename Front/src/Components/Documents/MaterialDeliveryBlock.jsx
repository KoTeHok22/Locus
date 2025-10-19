import React, { useState, useEffect } from 'react';
import { PackageCheck, UploadCloud, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ApiService from '../../apiService';

const MaterialDeliveryBlock = ({ projectId, onUpdate }) => {
    const [file, setFile] = useState(null);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [recognizedData, setRecognizedData] = useState(null);
    const [editableItems, setEditableItems] = useState([]);
    const [documentId, setDocumentId] = useState(null);

    useEffect(() => {
        if (recognizedData && recognizedData[0]?.items) {
            setEditableItems(recognizedData[0].items);
        } else {
            setEditableItems([]);
        }
    }, [recognizedData]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleRecognition = async () => {
        if (!file) {
            toast.error('Выберите файл для распознавания.');
            return;
        }
        setIsRecognizing(true);
        const toastId = toast.loading('Запущено распознавание ТТН...');
        try {
            const { document_id } = await ApiService.recognizeDocument(projectId, file);
            setDocumentId(document_id);

            let status = 'processing';
            while (status === 'processing' || status === 'pending') {
                await new Promise(resolve => setTimeout(resolve, 5000));
                const res = await ApiService.getRecognitionStatus(document_id);
                status = res.recognition_status;
                if (status === 'completed') {
                    toast.success('Документ успешно распознан!', { id: toastId });
                    setRecognizedData(res.recognized_data);
                    break;
                }
                 if (status === 'failed') {
                    throw new Error('Не удалось распознать документ.');
                }
            }
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsRecognizing(false);
        }
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...editableItems];
        updatedItems[index][field] = value;
        setEditableItems(updatedItems);
    };

    const handleConfirmDelivery = async () => {
        if (!documentId || !editableItems) {
            toast.error('Нет данных для подтверждения.');
            return;
        }
        const toastId = toast.loading('Регистрация поставки...');
        try {
            await ApiService.createDelivery(projectId, documentId, editableItems);
            toast.success('Поставка успешно зарегистрирована!', { id: toastId });
            setFile(null);
            setRecognizedData(null);
            setEditableItems([]);
            setDocumentId(null);
            onUpdate();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        }
    };

    if (recognizedData) {
        return (
            <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-100 p-2">
                            <PackageCheck size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Проверьте данные</h3>
                            <p className="text-xs text-slate-500 sm:text-sm">Отредактируйте позиции перед подтверждением</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 sm:p-6">
                    <div className="mb-4 max-h-96 space-y-3 overflow-y-auto">
                        {editableItems.map((item, index) => (
                            <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="space-y-3">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Наименование
                                        <input
                                            type="text"
                                            value={item.name || ''}
                                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="text-xs font-semibold text-slate-700">
                                            Количество
                                            <input
                                                type="number"
                                                value={item.quantity || ''}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            />
                                        </label>
                                        <label className="text-xs font-semibold text-slate-700">
                                            Ед. изм.
                                            <input
                                                type="text"
                                                value={item.unit || ''}
                                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setRecognizedData(null);
                                setFile(null);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            <XCircle size={16} />
                            Отмена
                        </button>
                        <button
                            onClick={handleConfirmDelivery}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                        >
                            <PackageCheck size={16} />
                            Подтвердить
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-2">
                        <PackageCheck size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Принять материал</h2>
                        <p className="text-xs text-slate-500 sm:text-sm">Загрузите фото ТТН для распознавания</p>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                <div className="space-y-4">
                    <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-all hover:border-blue-400 hover:bg-blue-50">
                        <UploadCloud size={32} className="text-blue-500" />
                        <div>
                            <span className="text-sm font-semibold text-slate-700">Выберите файл ТТН</span>
                            <p className="mt-1 text-xs text-slate-500">PNG, JPG или PDF до 10MB</p>
                        </div>
                        <input type="file" onChange={handleFileChange} className="hidden" accept="image/*,.pdf" />
                        {file && (
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                Выбран: {file.name}
                            </span>
                        )}
                    </label>

                    <button
                        onClick={handleRecognition}
                        disabled={isRecognizing || !file}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {isRecognizing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Распознавание...
                            </>
                        ) : (
                            <>
                                <PackageCheck size={18} />
                                Начать распознавание
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaterialDeliveryBlock;
