import {ArrowDown,ArrowUp,GripVertical} from 'lucide-react';
import type {DragEvent} from 'react';

export function StepOrderControls({
 index,total,onUp,onDown,onDragStart,onDragEnd
}:{
 index:number;total:number;
 onUp:()=>void;onDown:()=>void;
 onDragStart:(event:DragEvent<HTMLButtonElement>)=>void;
 onDragEnd:()=>void;
}){
 return <div className="step-order-controls" role="group" aria-label={`Reihenfolge Unteraufgabe ${index+1}`}>
  <button type="button" className="step-drag-handle" draggable
   aria-label={`Unteraufgabe ${index+1} ziehen`} title="Mit der Maus ziehen und auf eine andere Zeile ablegen"
   onDragStart={onDragStart} onDragEnd={onDragEnd}><GripVertical size={16}/></button>
  <div className="step-order-arrows">
   <button type="button" aria-label={`Unteraufgabe ${index+1} nach oben`} title="Schritt nach oben"
    disabled={index===0} onClick={onUp}><ArrowUp size={13}/></button>
   <button type="button" aria-label={`Unteraufgabe ${index+1} nach unten`} title="Schritt nach unten"
    disabled={index===total-1} onClick={onDown}><ArrowDown size={13}/></button>
  </div>
 </div>;
}
