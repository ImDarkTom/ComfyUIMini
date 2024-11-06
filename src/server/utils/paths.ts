import path from 'path';

const baseDir = path.join(__dirname, '..', '..', '..');

const paths = {
    views: path.join(baseDir, 'src', 'server', 'views'),
    public: path.join(baseDir, 'src', 'client', 'public'),
    workflows: path.join(baseDir, 'workflows'),
    config: path.join(baseDir, 'config'),
    clientJs: path.join(baseDir, 'dist', 'client', 'public'),
};

export default paths;
