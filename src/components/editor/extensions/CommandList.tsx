import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

interface CommandItem {
  title: string;
  description?: string;
  icon: string;
  command: (props: any) => void;
}

interface CommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

const CommandList = forwardRef((props: CommandListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) props.command(item);
  };

  useEffect(() => { setSelectedIndex(0); }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (!props.items.length) {
    return (
      <div className="bg-white rounded-xl shadow-2xl shadow-surface-900/15 border border-surface-200 p-4 text-center">
        <p className="text-xs text-surface-500">No matching commands</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl shadow-surface-900/15 border border-surface-200 overflow-hidden w-72 py-1.5">
      <div className="px-3 py-1.5 mb-0.5">
        <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Blocks</p>
      </div>
      {props.items.map((item, index) => (
        <button
          className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-all ${
            index === selectedIndex
              ? 'bg-primary-50 text-primary-900'
              : 'text-surface-700 hover:bg-surface-50'
          }`}
          key={index}
          onClick={() => selectItem(index)}
        >
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg border shadow-sm text-sm font-bold shrink-0 ${
            index === selectedIndex
              ? 'bg-primary-100 border-primary-200 text-primary-700'
              : 'bg-white border-surface-200 text-surface-500'
          }`}>
            {item.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{item.title}</p>
            {item.description && (
              <p className="text-[11px] text-surface-500 truncate">{item.description}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
});

CommandList.displayName = 'CommandList';
export default CommandList;
