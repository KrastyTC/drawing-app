import
{
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    ViewChild
} from '@angular/core';
import { MatTable } from '@angular/material/table';
import { Subscription, fromEvent } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';
import { IFigure, ILine } from 'src/app/interfaces';
import { HttpClient } from '@angular/common/http';
@Component({
    selector: 'drawing-board',
    templateUrl: "./drawing-board.component.html",
    styleUrls: ['./drawing-board.component.css']
})
export class DrawingBoardComponent implements AfterViewInit, OnDestroy
{
    @Input() width = 800;
    @Input() height = 500;
    @ViewChild('canvas') canvas: ElementRef | any;
    @ViewChild('MatTable') table: MatTable<any> | any;
    cx: CanvasRenderingContext2D | any;
    drawingSubscription: Subscription | any;
    figure: IFigure = {
        id: Date.now().toString(),
        rgb: '#000',
        lines: []
    };
    figures: IFigure[] = [];
    columnsToDisplay = ['id', 'rgb'];
    objFile = {
        table: []
    };
    constructor (private http: HttpClient) { }

    ngAfterViewInit()
    {

        const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
        this.cx = canvasEl.getContext('2d');

        canvasEl.width = this.width;
        canvasEl.height = this.height;

        this.cx.lineWidth = 3;
        this.cx.lineCap = 'round';
        this.cx.strokeStyle = '#000';
        this.figures.push(this.figure)

        this.captureEvents(canvasEl);
    }

    captureEvents(canvasEl: HTMLCanvasElement)
    {
        this.drawingSubscription = fromEvent(canvasEl, 'mousedown')
            .pipe(
                switchMap(e =>
                {
                    return fromEvent<MouseEvent>(canvasEl, 'mousemove').pipe(
                        takeUntil<MouseEvent>(fromEvent(canvasEl, 'mouseup')),
                        takeUntil<MouseEvent>(fromEvent(canvasEl, 'mouseleave')),
                        pairwise()
                    );
                })
            )
            .subscribe((res: [MouseEvent, MouseEvent]) =>
            {
                const rect = canvasEl.getBoundingClientRect();
                const prevPos = {
                    x: res[0].clientX - rect.left,
                    y: res[0].clientY - rect.top
                };

                const currentPos = {
                    x: res[1].clientX - rect.left,
                    y: res[1].clientY - rect.top
                };

                this.drawOnCanvas(prevPos, currentPos);
                const newline: ILine = { start: prevPos, end: currentPos };
                this.figure.lines.push(newline);
                this.table.renderRows();
            });
    }

    drawOnCanvas(
        prevPos: { x: number; y: number },
        currentPos: { x: number; y: number }
    )
    {
        if (!this.cx)
        {
            return;
        }

        this.cx.beginPath();

        if (prevPos)
        {
            this.cx.moveTo(prevPos.x, prevPos.y);
            this.cx.lineTo(currentPos.x, currentPos.y);

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
            this.figures = [];
            this.newFigure();
            this.table.renderRows();
        }

    }

    newFigure()
    {
        const newFigure: IFigure = {
            id: Date.now().toString(),
            rgb: '#000',
            lines: []
        };
        this.figures.push(newFigure)
        this.figure = this.figures[this.figures.length - 1];
        this.cx.strokeStyle = '#000';
        this.table.renderRows();
    }

    onRowClick(row: any)
    {
        this.figure = row;
        this.cx.strokeStyle = row.rgb;
    }
    changeColor(rgb: string)
    {
        this.cx.strokeStyle = rgb;
        this.figure.lines.forEach(element =>
        {
            this.drawOnCanvas(element.start, element.end)
        });
        this.figure.rgb = rgb;
    }


    onFileSelected(event: Event): void
    {
        const file = (event.target as HTMLInputElement | any).files[0];
        if (file)
        {
            this.clearCanvas(this.canvas.nativeElement);
            this.readFile(file);
        }
    }

    readFile(file: File): void
    {
        const reader = new FileReader();
        reader.onload = (event) =>
        {
            const contents = event.target?.result as string | any;
            const json = JSON.parse(contents);
            console.log('File contents:', json);
            this.figures = json;
            this.figures.forEach(element =>
            {
                this.cx.strokeStyle = element.rgb
                element.lines.forEach(line =>
                {
                    this.drawOnCanvas(line.start, line.end)
                });
            });
        };
        reader.readAsText(file);
    }

    downloadJsonFile(data: any, filename: string): void
    {
        const json = JSON.stringify(data);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);
    }

    ngOnDestroy()
    {
        this.drawingSubscription.unsubscribe();
    }
}