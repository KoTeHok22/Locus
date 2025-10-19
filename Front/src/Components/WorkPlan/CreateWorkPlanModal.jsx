import React, { useState } from 'react';
import ApiService from '../../apiService';
import toast from 'react-hot-toast';

const CreateWorkPlanModal = ({ projectId, onClose, onSuccess }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [items, setItems] = useState([{
        name: '',
        quantity: '',
        unit: '',
        start_date: '',
        end_date: ''
    }]);
    const [isLoading, setIsLoading] = useState(false);

    const handleAddItem = () => {
        setItems([...items, {
            name: '',
            quantity: '',
            unit: '',
            start_date: startDate,
            end_date: endDate
        }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!startDate || !endDate) {
            toast.error('Укажите общие сроки выполнения работ');
            return;
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.name || !item.quantity || !item.unit || !item.start_date || !item.end_date) {
                toast.error(`Заполните все поля для работы №${i + 1}`);
                return;
            }
        }

        setIsLoading(true);
        const toastId = toast.loading('Создание плана работ...');

        try {
            const workPlanData = {
                start_date: startDate,
                end_date: endDate,
                items: items.map(item => ({
                    name: item.name,
                    quantity: parseFloat(item.quantity),
                    unit: item.unit,
                    start_date: item.start_date,
                    end_date: item.end_date
                }))
            };

            await ApiService.createWorkPlan(projectId, workPlanData);
            toast.success('План работ успешно создан', { id: toastId });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-[10000] px-4">
            <div className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto sm:p-6 sm:rounded-3xl">
                <h2 className="text-lg font-bold mb-3 sm:text-xl sm:mb-4">Создание плана работ</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h3 className="text-sm font-semibold mb-3">Общие сроки выполнения</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">Дата начала работ</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    min={today}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">Дата окончания работ</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate || today}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-semibold">Перечень работ</h3>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                            >
                                + Добавить работу
                            </button>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                                        >
                                            ✕
                                        </button>
                                    )}
                                    
                                    <h4 className="text-sm font-medium mb-3">Работа №{index + 1}</h4>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Наименование работы</label>
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                placeholder="Устройство покрытия асфальтобетонной пешеходной дорожки"
                                                required
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Объем</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                    placeholder="18"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Единица измерения</label>
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                    placeholder="кв.м"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Срок начала</label>
                                                <input
                                                    type="date"
                                                    value={item.start_date}
                                                    onChange={(e) => handleItemChange(index, 'start_date', e.target.value)}
                                                    min={startDate || today}
                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Срок окончания</label>
                                                <input
                                                    type="date"
                                                    value={item.end_date}
                                                    onChange={(e) => handleItemChange(index, 'end_date', e.target.value)}
                                                    min={item.start_date || startDate || today}
                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-4 mt-6">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            disabled={isLoading}
                        >
                            Отмена
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700"
                        >
                            {isLoading ? 'Создание...' : 'Создать план работ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateWorkPlanModal;
