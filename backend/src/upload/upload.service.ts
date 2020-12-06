import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
    TMP_UPLOAD_PROVIDER_ID,
    TmpUpload,
} from '../database/models/TmpUpload';
import { Model } from 'mongoose';
import { HeaderMappingInputDto } from './dto/header-mapping.input.dto';
import { CsvFile } from './csv-file.interceptor';
import { InstitutionInputDto } from '../institution/dto/institution.input.dto';
import {
    Institution,
    INSTITUTION_PROVIDER_ID,
} from '../database/models/Institution';
import {
    Collection,
    COLLECTION_PROVIDER_ID,
} from '../database/models/Collection';
import { CollectionInputDto } from '../collection/dto/collection.input.dto';
import { MapUploadOutputDto } from './dto/map-upload.output.dto';
import { map } from 'rxjs/operators';

@Injectable()
export class UploadService {
    constructor(
        @Inject(TMP_UPLOAD_PROVIDER_ID)
        private readonly upload: Model<TmpUpload>,
        @Inject(INSTITUTION_PROVIDER_ID)
        private readonly institution: Model<Institution>,
        @Inject(COLLECTION_PROVIDER_ID)
        private readonly collection: Model<Collection>,) { }

    async create(data: CsvFile): Promise<string> {
        const upload = await this.upload.create(data);
        return upload._id;
    }

    async findByID(id: string): Promise<TmpUpload> {
        return this.upload.findById(id).exec();
    }

    async deleteByID(id: string): Promise<boolean> {
        const result = await this.upload.deleteOne({ _id: id }).exec();
        return result.deletedCount === 1;
    }

    async mapUpload(
        upload: TmpUpload,
        mappings: HeaderMappingInputDto): Promise<MapUploadOutputDto> {

        const newInstitutions = [];
        const newCollections = [];

        for (const row of upload.data) {
            const institution: InstitutionInputDto = {
                code: row[mappings.institutionCode] as string,
                name: row[mappings.institutionName] as string
            };
            newInstitutions.push(institution);
        }

        const institutions = await this.institution.insertMany(
            newInstitutions,
            { lean: true }
        ) as Institution[];

        for (let instIdx = 0; instIdx < institutions.length; instIdx++) {
            const iid = institutions[instIdx]._id;
            const row = upload.data[instIdx];

            const collection: CollectionInputDto = {
                name: row[mappings.collectionName] as string,
                code: row[mappings.collectionName] as string,
                institution: iid,
                size: row[mappings.size] as number,
                location: {
                    country: row[mappings.country] as string,
                    state: row[mappings.state] as string,
                    lat: row[mappings.lat] as number,
                    lng: row[mappings.lng] as number
                },
                tier: row[mappings.tier] as number,
                url: row[mappings.url] as string,
                inIdigbio: row[mappings.inIdigbio] as boolean,
                scan: {
                    exists: row[mappings.scanExists] as boolean,
                    scanType: row[mappings.scanType] as string
                },
                gbif: {
                    exists: row[mappings.gbifExists] as boolean,
                    date: row[mappings.gbifDate] as Date
                }
            };
            newCollections.push(collection);
        }

        const collections = await this.collection.insertMany(newCollections);

        await this.upload.deleteOne({ _id: upload._id });
        return new MapUploadOutputDto({ institutions, collections });
    }
}
