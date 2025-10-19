import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ApiService from '../../apiService';
import { translate } from '../../utils/translation';

const ResolvedIssueItem = ({ issue }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{issue.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold border-green-200 bg-green-100 text-green-800'}`}>
                            {translate(issue.status)}
                        </span>
                        {issue.resolved_at && (
                            <span className="text-xs text-slate-500">
                                Устранено: {new Date(issue.resolved_at).toLocaleDateString('ru-RU')}
                            </span>
                        )}
                    </div>
                </div>
                <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title={isExpanded ? 'Свернуть' : 'Развернуть'}
                    >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="mt-4 border-t border-green-200 pt-4">
                    {issue.resolution_comment && (
                        <div className="mb-4">
                            <h4 className="text-sm font-medium text-slate-900">Комментарий к устранению</h4>
                            <p className="mt-1 text-sm text-slate-700">{issue.resolution_comment}</p>
                        </div>
                    )}
                    {issue.resolution_photos && issue.resolution_photos.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-900">Фотографии устранения</h4>
                            <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {issue.resolution_photos.map((photo, index) => (
                                    <a key={index} href={`${ApiService.getBaseUrl()}/uploads/${photo}`} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={`${ApiService.getBaseUrl()}/uploads/${photo}`}
                                            alt={`Resolution photo ${index + 1}`}
                                            className="h-auto w-full rounded-lg object-cover shadow-md transition-transform hover:scale-105"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    {!issue.resolution_comment && (!issue.resolution_photos || issue.resolution_photos.length === 0) && (
                        <p className="text-sm text-slate-500">Нет подробной информации об устранении.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResolvedIssueItem;
