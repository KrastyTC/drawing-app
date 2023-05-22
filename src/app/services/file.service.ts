import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FileService
{
    obj = {
        table: []
    };

    fs = require('fs');


    saveData()
    {
        const json = JSON.stringify(this.obj);
        this.fs.writeFile('myjsonfile.json', json, 'utf8');
    }
    loadData()
    {

        var data = this.fs.readFile('myjsonfile.json', 'utf8')
        this.obj = JSON.parse(data);
    }
}
