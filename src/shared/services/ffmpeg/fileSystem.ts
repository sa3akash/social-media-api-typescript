import { BadRequestError } from '@globals/helpers/errorHandler';
import fs from 'node:fs';

class FileSystem {

    public async moveFile(sourcePath: string, destinationPath: string){
        // if(!fs.existsSync(destinationPath)){
        //     fs.mkdirSync(destinationPath,{recursive:true});
        // }
        fs.rename(sourcePath, destinationPath,(err)=>{
            if(err) throw new BadRequestError('Something went wrong. when moving file');
        }); 
    }
    public async makeDir(destinationPath: string){
        if(!fs.existsSync(destinationPath)){
            fs.mkdirSync(destinationPath,{recursive:true});
        } 
    }
}


export const fileSystem:FileSystem = new FileSystem();