import path from 'path';

const baseDir = path.join(__dirname, '..', '..');

const paths = {
    views: path.join(baseDir, 'src', 'views'),
    public: path.join(baseDir, 'src', 'public'),
    workflows: path.join(baseDir, 'workflows'),
    config: path.join(baseDir, 'config'),
};

export default paths;
