export enum Operation {
    Add = 0,
    Edit = 1,
    Delete = 2
}

export enum ElementsCv {
    File = 0,
    Presentation = 1,
    Experience = 2,
    Formation = 3,
    Langue = 4,
    Certification = 5,
    Projet = 6
}

export interface CvAuditLogDto {
    id?: string;
    cvId: string;
    typeOperation: Operation;
    element: ElementsCv;
    modifiedBy: string;
    dateModification?: Date;
}