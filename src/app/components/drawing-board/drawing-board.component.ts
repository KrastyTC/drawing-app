import
{
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    ViewChild
} from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';
import { IFigure, ILine } from 'src/app/interfaces'

@Component({
    selector: 'drawing-board',
    templateUrl: "./drawing-board.component.html",
    styles: [
        `
        canvas {
          border: 1px solid #000;
        }
        :host button{
    margin: 3px;
}
      `
    ]
})
export class DrawingBoardComponent implements AfterViewInit, OnDestroy
{
    @Input() width = 800;
    @Input() height = 500;
    @ViewChild('canvas') canvas: ElementRef | any;
    cx: CanvasRenderingContext2D | any;
    drawingSubscription: Subscription | any;
    figure: IFigure = {
        id: 1,
        rgb: '#000',
        lines: []
    }
    constructor () { }

    ngAfterViewInit()
    {
        // get the context
        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        this.cx = canvasEl.getContext('2d');

        // set the width and height
        canvasEl.width = this.width;
        canvasEl.height = this.height;

        // set some default properties about the line
        this.cx.lineWidth = 3;
        this.cx.lineCap = 'round';
        this.cx.strokeStyle = '#000';




        // we'll implement this method to start capturing mouse events
        this.captureEvents(canvasEl);
    }

    captureEvents(canvasEl: HTMLCanvasElement)
    {
        // this will capture all mousedown events from teh canvas element
        this.drawingSubscription = fromEvent(canvasEl, 'mousedown')
            .pipe(
                switchMap(e =>
                {
                    // after a mouse down, we'll record all mouse moves
                    return fromEvent<MouseEvent>(canvasEl, 'mousemove').pipe(
                        // we'll stop (and unsubscribe) once the user releases the mouse
                        // this will trigger a 'mouseup' event
                        takeUntil<MouseEvent>(fromEvent(canvasEl, 'mouseup')),
                        // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
                        takeUntil<MouseEvent>(fromEvent(canvasEl, 'mouseleave')),
                        // pairwise lets us get the previous value to draw a line from
                        // the previous point to the current point
                        pairwise()
                    );
                })
            )
            .subscribe((res: [MouseEvent, MouseEvent]) =>
            {
                const rect = canvasEl.getBoundingClientRect();

                // previous and current position with the offset
                const prevPos = {
                    x: res[0].clientX - rect.left,
                    y: res[0].clientY - rect.top
                };

                const currentPos = {
                    x: res[1].clientX - rect.left,
                    y: res[1].clientY - rect.top
                };

                // this method we'll implement soon to do the actual drawing
                this.drawOnCanvas(prevPos, currentPos);
                const newline: ILine = { start: prevPos, end: currentPos };
                this.figure.lines.push(newline);
            });
    }

    drawOnCanvas(
        prevPos: { x: number; y: number },
        currentPos: { x: number; y: number }
    )
    {
        // incase the context is not set
        if (!this.cx)
        {
            return;
        }

        // start our drawing path
        this.cx.beginPath();

        // we're drawing lines so we need a previous position
        if (prevPos)
        {
            // sets the start point
            this.cx.moveTo(prevPos.x, prevPos.y); // from
            // draws a line from the start pos until the current position
            this.cx.lineTo(currentPos.x, currentPos.y);

            // strokes the current path with the styles we set earlier
            this.cx.stroke();
        }
    }

    clearCanvas(canvas: HTMLCanvasElement)
    {
        const context = canvas.getContext('2d');
        if (context)
        {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height)
            this.figure.lines = [];
        }

    }
    changeColor(rgb: string)
    {
        this.cx.strokeStyle = rgb;
        this.figure.lines.forEach(element =>
        {
            this.drawOnCanvas(element.start, element.end)
        });
    }

    ngOnDestroy()
    {
        // this will remove event lister when this component is destroyed
        this.drawingSubscription.unsubscribe();
    }
}