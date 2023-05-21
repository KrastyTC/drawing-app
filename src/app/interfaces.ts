export interface IFigure
{
    id: number,
    rgb: string,
    lines: ILine[]

}
export interface ILine
{
    start: { x: number; y: number },
    end: { x: number; y: number }
}