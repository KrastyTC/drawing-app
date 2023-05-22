export interface IFigure
{
    id: string,
    rgb: string,
    lines: ILine[]

}
export interface ILine
{
    start: { x: number; y: number },
    end: { x: number; y: number }
}