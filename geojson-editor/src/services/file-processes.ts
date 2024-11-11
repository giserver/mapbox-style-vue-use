import { TIdentityGeoJSONFeature, Tools } from "../../../packages/maplugin-maplibre";
import shp from "shpjs";

function appendId(fc: GeoJSON.FeatureCollection) {
    fc.features.forEach(f => {
        f.properties ??= {};
        if (!f.properties['id']) {
            f.properties['id'] = Tools.uuid();
        }
    });
    return fc;
}

const FileProcesses: Array<{
    extension: string,
    description: string,
    contentType: string
    decode?(file: File): Promise<Array<TIdentityGeoJSONFeature>>,
    encode?(geojson: GeoJSON.FeatureCollection): string | Blob
}> = [{
    extension: ".geojson",
    description: "geojson",
    contentType: "application/json",
    async decode(file) {
        const str = await file.text();
        const geojson = JSON.parse(str) as GeoJSON.FeatureCollection;
        return appendId(geojson).features as any;
    },

    encode(geojson) {
        return JSON.stringify(geojson, null, 4);
    }
}, {
    extension: ".zip",
    description: "shp file (zip)",
    contentType: "application/x-zip-compressed",
    async decode(file) {
        const buffer = await file.arrayBuffer();
        const geojson = await shp(buffer) as GeoJSON.FeatureCollection;
        return appendId(geojson).features as any;
    }
}]

export default FileProcesses;