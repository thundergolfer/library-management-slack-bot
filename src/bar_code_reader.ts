import Quagga from 'quagga';
import * as request from "request";

export function decodeCodeFromUrl(url: string, size: number, downloadToken: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        request.get(url, {
            encoding: null,
            headers: {'Authorization': `Bearer ${downloadToken}`}
        }, (err, response, body) => {
            if (err || !body) {
                reject(err);
            }

            Quagga.decodeSingle({
                src: body,
                inputStream: {
                    size,
                    mime: response.headers['content-type'],
                } as any, // The types don't include mime property so have to cast
                numOfWorkers: 0,
                decoder: {
                    readers: ['ean_reader'],
                },
                locator: {
                    patchSize: 'large'
                },
            }, result => {
                if (result.codeResult) {
                    console.log(`Decoded ISBN ${result.codeResult.code} from url ${url}`);
                    resolve(result.codeResult.code);
                } else {
                    console.error(`Failed to decoded ISBN from url ${url}`);
                    reject();
                }
            })

        });
    });
}
