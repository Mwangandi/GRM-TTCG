import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Edit2, Search } from 'lucide-react';
import { Category } from '../types';

interface Template {
  id: string;
  category: Category;
  title: string;
  content: string;
}

const mockTemplates: Template[] = [
  {
    id: '1',
    category: 'Service Delay',
    title: 'Standard Service Delay Response',
    content: 'We apologize for the delay. Your request is being processed. Typical turnaround has been impacted by heavy volume, but we are prioritizing it.'
  },
  {
    id: '2',
    category: 'Corruption',
    title: 'Initial Investigation Notice',
    content: 'Your report has been received and forwarded to the investigative committee. Pending further inquiry, strict confidentiality is maintained.'
  }
];

export function KnowledgeBase() {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const categories: Category[] = [
    'Service Delay', 'Corruption', 'GBV', 'General Complaint', 'Compliment', 'Suggestion', 'Emergency'
  ];

  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTemplate) return;

    if (editingTemplate.id) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? editingTemplate : t));
    } else {
      setTemplates([...templates, { ...editingTemplate, id: Date.now().toString() }]);
    }
    setEditingTemplate(null);
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
      {/* Template List */}
      <div className="flex-1 overflow-y-auto border-r border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              Resolution Templates
            </h3>
            <button 
              onClick={() => setEditingTemplate({ id: '', category: 'General Complaint', title: '', content: '' })}
              className="flex items-center gap-1 bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-amber-700 transition"
            >
              <Plus className="w-4 h-4" /> New Template
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search templates..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 ring-amber-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredTemplates.map(template => (
            <div key={template.id} className="p-4 hover:bg-slate-50 transition group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">
                  {template.category}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-2">
                  <button onClick={() => setEditingTemplate({ ...template })} className="text-slate-400 hover:text-amber-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteTemplate(template.id)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h4 className="font-medium text-slate-800 mb-1">{template.title}</h4>
              <p className="text-sm text-slate-500 line-clamp-2">{template.content}</p>
            </div>
          ))}
          {filteredTemplates.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No templates found.</div>
          )}
        </div>
      </div>

      {/* Editor Panel */}
      {editingTemplate && (
        <div className="flex-1 max-w-lg bg-white border-l border-slate-200 p-6 overflow-y-auto">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">
            {editingTemplate.id ? 'Edit Template' : 'Create New Template'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                value={editingTemplate.category}
                onChange={e => setEditingTemplate({...editingTemplate, category: e.target.value as Category})}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 ring-amber-500 bg-white"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template Title</label>
              <input 
                type="text" 
                required
                value={editingTemplate.title}
                onChange={e => setEditingTemplate({...editingTemplate, title: e.target.value})}
                placeholder="e.g. Standard Service Delay"
                className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 ring-amber-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resolution Content</label>
              <textarea 
                required
                rows={8}
                value={editingTemplate.content}
                onChange={e => setEditingTemplate({...editingTemplate, content: e.target.value})}
                placeholder="Draft the resolution response here..."
                className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 ring-amber-500 resize-y"
              />
              <p className="text-xs text-slate-400 mt-2">This template will be available for quick-pasting by departmental staff when resolving cases.</p>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <button 
                type="button" 
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition"
              >
                Save Template
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
