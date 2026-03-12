import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

interface CommandListProps {
  items: any[];
  command: (item: any) => void;
}

const CommandList = forwardRef((props: CommandListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (!props.items.length) {
    return <div className="hidden"></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-xl shadow-surface-900/10 border border-surface-200 overflow-hidden w-64 text-sm font-medium py-1">
      {props.items.map((item, index) => (
        <button
          className={`flex items-center gap-3 w-full px-4 py-2 text-left transition-colors ${index === selectedIndex ? 'bg-primary-50 text-primary-900' : 'text-surface-700 hover:bg-surface-50'}`}
          key={index}
          onClick={() => selectItem(index)}
        >
          <div className="flex items-center justify-center w-6 h-6 rounded bg-white border border-surface-200 text-surface-500 font-bold text-[10px] shadow-sm">
            {item.icon}
          </div>
          {item.title}
        </button>
      ))}
    </div>
  );
});

CommandList.displayName = 'CommandList';
export default CommandList;
