import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../../components';
// import Breadcrumb from '../../../components/common/Breadcrumb';
import Container from '../../../components/common/Container';
import FormSelect from '../../../components/base/FormSelect';
import FolderIcon from '../../../components/icons/FolderIcon';
import UploadFileSidebar from '../../../components/project/UploadFileSidebar';
import CreateFolderModal from '../../../components/project/CreateFolderModal';
import PreviewEditModal from '../../../components/project/PreviewEditModal';
import RenameFileModal from '../../../components/project/RenameFileModal';
import DeleteFileModal from '../../../components/project/DeleteFileModal';
import MoveToFolderModal from '../../../components/project/MoveToFolderModal';
import RenameFolderModal from '../../../components/project/RenameFolderModal';
import DeleteFolderModal from '../../../components/project/DeleteFolderModal';
import MoveFolderModal from '../../../components/project/MoveFolderModal';
import { useDisclosure } from '@mantine/hooks';
import {
  useGetFileManagerQuery,
  useGetFolderContentsQuery,
  useMoveFileOrFolderMutation,
  useDownloadFolderMutation,
} from '../../../store/services/fileManager/fileManager';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  IconFile,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconDots,
  IconArrowRight,
  IconPencil,
  IconDownload,
  IconTrash,
  IconEye,
  IconChevronRight,
  IconHome,
  IconGridDots,
  IconList,
  IconSearch,
} from '@tabler/icons-react';
import { formatBytes } from '../../../constants/fileUpload';
import { Image } from '../../../components/base';
import MenuModal from '../../../components/base/MenuModal';
import IconButton from '../../../components/base/button/IconButton';
import { Menu } from '@mantine/core';
import { downloadFile } from '../../../utils/helper';
import { toast } from 'react-toastify';

export default function ProjectFilesPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [uploadOpened, { open: openUpload, close: closeUpload }] = useDisclosure(false);
  const [createFolderModalOpened, { open: openCreateFolderModal, close: closeCreateFolderModal }] =
    useDisclosure(false);
  const [previewModalOpened, { open: openPreviewModal, close: closePreviewModal }] =
    useDisclosure(false);
  const [renameModalOpened, { open: openRenameModal, close: closeRenameModal }] =
    useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [moveToFolderModalOpened, { open: openMoveToFolderModal, close: closeMoveToFolderModal }] =
    useDisclosure(false);
  const [renameFolderModalOpened, { open: openRenameFolderModal, close: closeRenameFolderModal }] =
    useDisclosure(false);
  const [deleteFolderModalOpened, { open: openDeleteFolderModal, close: closeDeleteFolderModal }] =
    useDisclosure(false);
  const [moveFolderModalOpened, { open: openMoveFolderModal, close: closeMoveFolderModal }] =
    useDisclosure(false);
  const [selectedFile, setSelectedFile] = useState<
    import('../../../store/types/fileManager.types').TFileManagerFile | null
  >(null);
  const [selectedFolder, setSelectedFolder] = useState<
    import('../../../store/types/fileManager.types').TFileManagerFolder | null
  >(null);

  // Folder navigation state
  type BreadcrumbItem = { id: string | null; name: string };
  const [folderBreadcrumb, setFolderBreadcrumb] = useState<BreadcrumbItem[]>([
    { id: null, name: 'All Files' },
  ]);
  const currentFolderId = folderBreadcrumb[folderBreadcrumb.length - 1].id;

  // Sort state
  const [sortBy, setSortBy] = useState<string>('modifiedDesc');

  // View state (grid or list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drag and drop state
  const [activeFile, setActiveFile] = useState<
    import('../../../store/types/fileManager.types').TFileManagerFile | null
  >(null);
  const [moveFileOrFolder] = useMoveFileOrFolderMutation();

  // Configure drag sensors with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before starting drag
      },
    }),
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const file = currentData?.data?.files?.find((f) => f.id === active.id);
    if (file) {
      setActiveFile(file);
    }
  };

  // Handle drag end - move file to folder
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveFile(null);

    if (!over || active.id === over.id) return;

    // Check if dropped on a folder
    const targetFolderId = over.id as string;
    const isFolder = currentData?.data?.folders?.some((f) => f.id === targetFolderId);

    if (isFolder) {
      moveFileOrFolder({
        fileId: active.id as string,
        targetFolderId: targetFolderId,
      })
        .unwrap()
        .then(() => {
          toast.success('File moved successfully');
          handleRefetch();
        })
        .catch((error: any) => {
          console.error('Error moving file:', error);
          toast.error(error?.data?.message || 'Failed to move file');
        });
    }
  };

  // Sort options
  const sortOptions = [
    { label: 'Name (A-Z)', value: 'nameAsc' },
    { label: 'Name (Z-A)', value: 'nameDesc' },
    { label: 'Size (Small to Large)', value: 'sizeAsc' },
    { label: 'Size (Large to Small)', value: 'sizeDesc' },
    { label: 'Modified (Newest First)', value: 'modifiedDesc' },
    { label: 'Modified (Oldest First)', value: 'modifiedAsc' },
  ];

  // Fetch root files and folders
  const {
    data: fileManagerData,
    isLoading: isLoadingRoot,
    refetch: refetchRoot,
  } = useGetFileManagerQuery(
    { projectId: projectId || '', sortBy, search: searchQuery },
    { skip: !projectId || currentFolderId !== null },
  );

  // Fetch folder contents
  const {
    data: folderContentsData,
    isLoading: isLoadingFolder,
    refetch: refetchFolder,
  } = useGetFolderContentsQuery(
    { folderId: currentFolderId || '', sortBy, search: searchQuery },
    { skip: !currentFolderId },
  );

  // Determine which data to use
  const isLoading = currentFolderId ? isLoadingFolder : isLoadingRoot;
  const currentData = currentFolderId ? folderContentsData : fileManagerData;

  // Handle folder click to navigate into folder
  const handleFolderClick = (
    folder: import('../../../store/types/fileManager.types').TFileManagerFolder,
  ) => {
    setFolderBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  // Handle breadcrumb click to navigate back
  const handleBreadcrumbClick = (index: number) => {
    setFolderBreadcrumb((prev) => prev.slice(0, index + 1));
  };

  // Refetch appropriate query after operations
  const handleRefetch = () => {
    if (currentFolderId) {
      // Inside a folder - refetch folder contents
      refetchFolder();
    } else {
      // At root - refetch root files and folders
      refetchRoot();
    }
  };

  return (
    // <div className='h-full min-h-full'>
    <>
      <Container className=' gap-3 h-full '>
        <h6 className='font-bold text-sm'>FILES</h6>
        <hr className='border border-gray-200' />

        {/* Breadcrumb Navigation */}
        {folderBreadcrumb.length > 0 && (
          <div className='flex items-center gap-2 text-sm'>
            {folderBreadcrumb.map((item, index) => (
              <div key={item.id || 'root'} className='flex items-center gap-2'>
                {index === 0 ? (
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`flex items-center gap-1 cursor-pointer ${
                      index === folderBreadcrumb.length - 1
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:underline'
                    }`}
                  >
                    <IconHome className='size-4' />
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`cursor-pointer ${
                      index === folderBreadcrumb.length - 1
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:underline'
                    }`}
                  >
                    {item.name}
                  </button>
                )}
                {index < folderBreadcrumb.length - 1 && (
                  <IconChevronRight className='size-4 text-gray-400' />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Two Column Header Layout */}
        <div className='flex items-center justify-between gap-6'>
          {/* LEFT SIDE - Search, Sort, View Toggle */}
          <div className='flex items-center gap-3 flex-1'>
            {/* Search Field */}
            <div className='relative w-80'>
              <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400' />
              <input
                type='text'
                placeholder='Search'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm'
              />
            </div>

            {/* Sort Dropdown */}
            <div className='w-52'>
              <FormSelect
                placeholder='Modified'
                value={sortBy}
                onChange={(value) => setSortBy(value || 'modifiedDesc')}
                options={sortOptions}
              />
            </div>

            {/* View Toggle Buttons - Enhanced */}
            <div className='flex border border-gray-300 rounded-lg overflow-hidden bg-white'>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title='Grid View'
              >
                <IconGridDots className='size-5' />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 transition-all border-l border-gray-300 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title='List View'
              >
                <IconList className='size-5' />
              </button>
            </div>
          </div>

          {/* RIGHT SIDE - Action Buttons */}
          <div className='flex items-center gap-3'>
            <Button
              size='md'
              variant='outline'
              radius='full'
              className='bg-white'
              onClick={openCreateFolderModal}
            >
              Create Folder
            </Button>
            <Button size='md' radius='full' onClick={openUpload}>
              Upload File
            </Button>
          </div>
        </div>

        {/* CONTENT SECTION */}
        {isLoading ? (
          <div className='mt-10 flex items-center justify-center'>
            <p className='text-gray-500'>Loading...</p>
          </div>
        ) : viewMode === 'grid' ? (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {/* GRID VIEW - FOLDERS SECTION */}
            {currentData?.data?.folders && currentData.data.folders.length > 0 && (
              <section className='mt-10 flex flex-wrap gap-x-10 gap-y-8'>
                {currentData.data.folders.map((folder) => (
                  <DroppableFolder
                    key={folder.id}
                    folder={folder}
                    onClick={handleFolderClick}
                    onRename={(folder) => {
                      setSelectedFolder(folder);
                      openRenameFolderModal();
                    }}
                    onDelete={(folder) => {
                      setSelectedFolder(folder);
                      openDeleteFolderModal();
                    }}
                    onMove={(folder) => {
                      setSelectedFolder(folder);
                      openMoveFolderModal();
                    }}
                    projectId={projectId || ''}
                  />
                ))}
              </section>
            )}

            {/* GRID VIEW - FILES SECTION */}
            {currentData?.data?.files && currentData.data.files.length > 0 && (
              <section className='mt-10 flex flex-wrap gap-x-10 gap-y-8'>
                {currentData.data.files.map((file) => (
                  <DraggableFileItem
                    key={file.id}
                    file={file}
                    onPreview={(file) => {
                      setSelectedFile(file);
                      openPreviewModal();
                    }}
                    onRename={(file) => {
                      setSelectedFile(file);
                      openRenameModal();
                    }}
                    onDelete={(
                      file: import('../../../store/types/fileManager.types').TFileManagerFile,
                    ) => {
                      setSelectedFile(file);
                      openDeleteModal();
                    }}
                    onMoveToFolder={(
                      file: import('../../../store/types/fileManager.types').TFileManagerFile,
                    ) => {
                      setSelectedFile(file);
                      openMoveToFolderModal();
                    }}
                  />
                ))}
              </section>
            )}

            {/* Empty State */}
            {currentData?.data &&
              currentData.data.folders.length === 0 &&
              currentData.data.files.length === 0 && (
                <div className='mt-10 flex items-center justify-center'>
                  <p className='text-gray-500'>
                    {currentFolderId ? 'This folder is empty' : 'No files or folders found'}
                  </p>
                </div>
              )}

            {/* Drag Overlay - Visual feedback while dragging */}
            <DragOverlay>
              {activeFile ? (
                <div className='opacity-90 bg-white rounded-lg shadow-lg p-2 border-2 border-blue-500'>
                  <div className='w-20 h-20 flex items-center justify-center bg-gray-50 rounded'>
                    {activeFile.type === 'pdf' || activeFile.mimeType === 'application/pdf' ? (
                      <IconFileTypePdf className='size-10 text-red-500' />
                    ) : activeFile.mimeType ===
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                      activeFile.name.toLowerCase().endsWith('.docx') ? (
                      <IconFileTypeDocx className='size-10 text-blue-500' />
                    ) : activeFile.type === 'image' || activeFile.mimeType?.startsWith('image/') ? (
                      <Image
                        src={activeFile.url}
                        alt={activeFile.name}
                        className='w-full h-full object-cover rounded'
                        height={80}
                        width={80}
                      />
                    ) : (
                      <IconFile className='size-10 text-gray-400' />
                    )}
                  </div>
                  <p className='text-xs text-center mt-1 truncate max-w-[80px]'>
                    {activeFile.name}
                  </p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <>
            {/* LIST VIEW */}
            {currentData?.data &&
            (currentData.data.folders.length > 0 || currentData.data.files.length > 0) ? (
              <div className='mt-10 overflow-x-auto'>
                <table className='min-w-full bg-white border border-gray-200 rounded-lg'>
                  <thead className='bg-gray-50 border-b border-gray-200'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8'>
                        <input type='checkbox' className='rounded border-gray-300' />
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Name
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Owner
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Date Modified
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        File Size
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200'>
                    {/* Folders */}
                    {currentData.data.folders.map((folder) => (
                      <FolderListItem
                        key={folder.id}
                        folder={folder}
                        onClick={handleFolderClick}
                        onRename={(folder) => {
                          setSelectedFolder(folder);
                          openRenameFolderModal();
                        }}
                        onDelete={(folder) => {
                          setSelectedFolder(folder);
                          openDeleteFolderModal();
                        }}
                        onMove={(folder) => {
                          setSelectedFolder(folder);
                          openMoveFolderModal();
                        }}
                        projectId={projectId || ''}
                      />
                    ))}
                    {/* Files */}
                    {currentData.data.files.map((file) => (
                      <FileListItem
                        key={file.id}
                        file={file}
                        onPreview={(file) => {
                          setSelectedFile(file);
                          openPreviewModal();
                        }}
                        onRename={(file) => {
                          setSelectedFile(file);
                          openRenameModal();
                        }}
                        onDelete={(file) => {
                          setSelectedFile(file);
                          openDeleteModal();
                        }}
                        onMoveToFolder={(file) => {
                          setSelectedFile(file);
                          openMoveToFolderModal();
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='mt-10 flex items-center justify-center'>
                <p className='text-gray-500'>
                  {currentFolderId ? 'This folder is empty' : 'No files or folders found'}
                </p>
              </div>
            )}
          </>
        )}
      </Container>
      <UploadFileSidebar
        opened={uploadOpened}
        onClose={closeUpload}
        onUploadSuccess={handleRefetch}
        currentFolderId={currentFolderId}
      />
      <CreateFolderModal
        opened={createFolderModalOpened}
        onClose={closeCreateFolderModal}
        projectId={projectId || undefined}
        parentFolderId={currentFolderId || undefined}
        onSuccess={handleRefetch}
      />
      <PreviewEditModal
        opened={previewModalOpened}
        onClose={closePreviewModal}
        file={selectedFile}
        onSuccess={handleRefetch}
      />
      <RenameFileModal
        opened={renameModalOpened}
        onClose={closeRenameModal}
        file={selectedFile}
        onSuccess={handleRefetch}
      />
      <DeleteFileModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        file={selectedFile}
        onSuccess={handleRefetch}
      />
      <MoveToFolderModal
        opened={moveToFolderModalOpened}
        onClose={closeMoveToFolderModal}
        file={selectedFile}
        projectId={projectId || undefined}
        onSuccess={handleRefetch}
      />
      <RenameFolderModal
        opened={renameFolderModalOpened}
        onClose={closeRenameFolderModal}
        folder={selectedFolder}
        onSuccess={handleRefetch}
      />
      <DeleteFolderModal
        opened={deleteFolderModalOpened}
        onClose={closeDeleteFolderModal}
        folder={selectedFolder}
        onSuccess={handleRefetch}
      />
      <MoveFolderModal
        opened={moveFolderModalOpened}
        onClose={closeMoveFolderModal}
        folder={selectedFolder}
        projectId={projectId || undefined}
        onSuccess={handleRefetch}
      />
    </>
    // </div>
  );
}

function Folder({
  folder,
  onClick,
  onRename,
  onDelete,
  onMove,
  projectId,
}: {
  folder: import('../../../store/types/fileManager.types').TFileManagerFolder;
  onClick: (folder: import('../../../store/types/fileManager.types').TFileManagerFolder) => void;
  onRename: (folder: import('../../../store/types/fileManager.types').TFileManagerFolder) => void;
  onDelete: (folder: import('../../../store/types/fileManager.types').TFileManagerFolder) => void;
  onMove: (folder: import('../../../store/types/fileManager.types').TFileManagerFolder) => void;
  projectId: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFolder] = useDownloadFolderMutation();

  const handleClick = () => {
    onClick(folder);
  };

  const handleRename = () => {
    onRename(folder);
  };

  const handleDownload = async () => {
    if (!projectId) {
      toast.error('Project ID is missing');
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await downloadFolder({
        projectId,
        folderIds: [folder.id],
      }).unwrap();

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folder.name}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Folder downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading folder:', error);
      toast.error(error?.message || 'Failed to download folder');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    onDelete(folder);
  };

  const handleMove = () => {
    onMove(folder);
  };

  return (
    <div
      className='space-y-2 cursor-pointer hover:opacity-80 transition-opacity relative'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className='w-24 h-24 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 relative'>
        <FolderIcon className='w-16 h-16' />
        {(isHovered || menuOpened) && (
          <div className='absolute top-1 right-1 z-10'>
            <MenuModal
              opened={menuOpened}
              setOpened={setMenuOpened}
              withinPortal={true}
              trigger={
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpened(true);
                  }}
                  className='bg-white hover:bg-gray-100 shadow-sm'
                >
                  <IconDots className='size-4 text-gray-600' />
                </IconButton>
              }
              position='bottom-start'
            >
              <Menu.Item
                leftSection={<IconArrowRight className='size-4' />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMove();
                  setMenuOpened(false);
                }}
              >
                Move
              </Menu.Item>
              <Menu.Item
                leftSection={<IconPencil className='size-4' />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename();
                  setMenuOpened(false);
                }}
              >
                Rename
              </Menu.Item>
              <Menu.Item
                leftSection={<IconDownload className='size-4' />}
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleDownload();
                  setMenuOpened(false);
                }}
                disabled={isDownloading}
              >
                {isDownloading ? 'Downloading...' : 'Download'}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconTrash className='size-4' />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                  setMenuOpened(false);
                }}
                color='red'
              >
                Delete
              </Menu.Item>
            </MenuModal>
          </div>
        )}
      </div>
      <div className='text-center'>
        <p className='text-sm font-medium truncate max-w-[96px]' title={folder.name}>
          {folder.name}
        </p>
      </div>
    </div>
  );
}

function FileItem({
  file,
  onPreview,
  onRename,
  onDelete,
  onMoveToFolder,
}: {
  file: import('../../../store/types/fileManager.types').TFileManagerFile;
  onPreview: (file: import('../../../store/types/fileManager.types').TFileManagerFile) => void;
  onRename: (file: import('../../../store/types/fileManager.types').TFileManagerFile) => void;
  onDelete: (file: import('../../../store/types/fileManager.types').TFileManagerFile) => void;
  onMoveToFolder: (file: import('../../../store/types/fileManager.types').TFileManagerFile) => void;
}) {
  const isImage = file.type === 'image' || file.mimeType?.startsWith('image/');
  const isPdf = file.type === 'pdf' || file.mimeType === 'application/pdf';
  const isDocx =
    file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx');
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePreview = () => {
    onPreview(file);
  };

  const handleFileClick = () => {
    onPreview(file);
  };

  const handleMoveToFolder = () => {
    onMoveToFolder(file);
  };

  const handleRename = () => {
    onRename(file);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadFile(file.url, file.name);
      toast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    onDelete(file);
  };

  return (
    <div
      className='space-y-2 cursor-pointer hover:opacity-80 transition-opacity relative'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isImage ? (
        <div
          className='w-24 h-24 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50 relative cursor-pointer'
          onClick={handleFileClick}
        >
          <Image
            src={file.url}
            alt={file.name}
            className='w-full h-full object-cover'
            height={96}
            width={96}
          />
          {(isHovered || menuOpened) && (
            <div className='absolute top-1 right-1 z-10'>
              <MenuModal
                opened={menuOpened}
                setOpened={setMenuOpened}
                withinPortal={true}
                trigger={
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpened(true);
                    }}
                    className='bg-white hover:bg-gray-100 shadow-sm'
                  >
                    <IconDots className='size-4 text-gray-600' />
                  </IconButton>
                }
                position='bottom-start'
              >
                <Menu.Item
                  leftSection={<IconEye className='size-4' />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview();
                    setMenuOpened(false);
                  }}
                >
                  Preview
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconArrowRight className='size-4' />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveToFolder();
                    setMenuOpened(false);
                  }}
                >
                  Move to Folder
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPencil className='size-4' />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename();
                    setMenuOpened(false);
                  }}
                >
                  Rename
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconDownload className='size-4' />}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleDownload();
                    setMenuOpened(false);
                  }}
                  disabled={isDownloading}
                >
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconTrash className='size-4' />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                    setMenuOpened(false);
                  }}
                  color='red'
                >
                  Delete
                </Menu.Item>
              </MenuModal>
            </div>
          )}
        </div>
      ) : (
        <div
          className='w-24 h-24 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 relative cursor-pointer'
          onClick={handleFileClick}
        >
          {isPdf ? (
            <IconFileTypePdf className='size-12 text-red-500' />
          ) : isDocx ? (
            <IconFileTypeDocx className='size-12 text-blue-500' />
          ) : (
            <IconFile className='size-12 text-gray-400' />
          )}
          {(isHovered || menuOpened) && (
            <div className='absolute top-1 right-1 z-10'>
              <MenuModal
                opened={menuOpened}
                setOpened={setMenuOpened}
                withinPortal={true}
                trigger={
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpened(true);
                    }}
                    className='bg-white hover:bg-gray-100 shadow-sm'
                  >
                    <IconDots className='size-4 text-gray-600' />
                  </IconButton>
                }
                position='bottom-end'
              >
                <Menu.Item
                  leftSection={<IconArrowRight className='size-4' />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveToFolder();
                    setMenuOpened(false);
                  }}
                >
                  Move to Folder
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPencil className='size-4' />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename();
                    setMenuOpened(false);
                  }}
                >
                  Rename
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconDownload className='size-4' />}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleDownload();
                    setMenuOpened(false);
                  }}
                  disabled={isDownloading}
                >
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconTrash className='size-4' />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                    setMenuOpened(false);
                  }}
                  color='red'
                >
                  Delete
                </Menu.Item>
              </MenuModal>
            </div>
          )}
        </div>
      )}
      <div className='text-center'>
        <p className='text-sm font-medium truncate max-w-[96px]' title={file.name}>
          {file.name}
        </p>
        {file.size && <p className='text-xs text-gray-500'>{formatBytes(file.size)}</p>}
      </div>
    </div>
  );
}

// DRAG AND DROP WRAPPER COMPONENTS

function DroppableFolder({
  folder,
  onClick,
  onRename,
  onDelete,
  onMove,
  projectId,
}: {
  folder: import('../../../store/types/fileManager.types').TFileManagerFolder;
  onClick: (folder: import('../../../store/types/fileManager.types').TFileManagerFolder) => void;
  onRename: (folder: import('../../../store/types/fileManager.types').TFileManagerFolder) => void;
  onDelete: (folder: import('../../../store/types/fileManager.types').TFileManagerFolder) => void;
  onMove: (folder: import('../../../store/types/fileManager.types').TFileManagerFolder) => void;
  projectId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 rounded-lg ${
        isOver ? 'ring-2 ring-blue-500 ring-offset-2 scale-105 bg-blue-50' : ''
      }`}
    >
      <Folder
        folder={folder}
        onClick={onClick}
        onRename={onRename}
        onDelete={onDelete}
        onMove={onMove}
        projectId={projectId}
      />
    </div>
  );
}

function DraggableFileItem({
  file,
  onPreview,
  onRename,
  onDelete,
  onMoveToFolder,
}: {
  file: import('../../../store/types/fileManager.types').TFileManagerFile;
  onPreview: (file: import('../../../store/types/fileManager.types').TFileManagerFile) => void;
  onRename: (file: import('../../../store/types/fileManager.types').TFileManagerFile) => void;
  onDelete: (file: import('../../../store/types/fileManager.types').TFileManagerFile) => void;
  onMoveToFolder: (file: import('../../../store/types/fileManager.types').TFileManagerFile) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: file.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`transition-opacity ${isDragging ? 'opacity-50' : ''}`}
    >
      <FileItem
        file={file}
        onPreview={onPreview}
        onRename={onRename}
        onDelete={onDelete}
        onMoveToFolder={onMoveToFolder}
      />
    </div>
  );
}

// LIST VIEW COMPONENTS

function FolderListItem({
  folder,
  onClick,
  onRename,
  onDelete,
  onMove,
  projectId,
}: {
  folder: import('../../../store/types/fileManager.types').TFileManagerFolder;
  onClick: (folder: import('../../../store/types/fileManager.types').TFileManagerFolder) => void;
  onRename: (folder: import('../../../store/types/fileManager.types').TFileManagerFolder) => void;
  onDelete: (folder: import('../../../store/types/fileManager.types').TFileManagerFolder) => void;
  onMove: (folder: import('../../../store/types/fileManager.types').TFileManagerFolder) => void;
  projectId: string;
}) {
  const [menuOpened, setMenuOpened] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFolder] = useDownloadFolderMutation();

  const handleDownload = async () => {
    if (!projectId) {
      toast.error('Project ID is missing');
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await downloadFolder({
        projectId,
        folderIds: [folder.id],
      }).unwrap();

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folder.name}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Folder downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading folder:', error);
      toast.error(error?.message || 'Failed to download folder');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <tr
      className='hover:bg-gray-50 cursor-pointer transition-colors'
      onClick={() => onClick(folder)}
    >
      <td className='px-6 py-4'>
        <input
          type='checkbox'
          className='rounded border-gray-300'
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td className='px-6 py-4'>
        <div className='flex items-center gap-3'>
          <FolderIcon className='w-10 h-10 shrink-0' />
          <span className='text-sm font-medium text-gray-900'>{folder.name}</span>
        </div>
      </td>
      <td className='px-6 py-4 text-sm text-gray-600'>{folder.CreatedBy?.name || '-'}</td>
      <td className='px-6 py-4 text-sm text-gray-600'>
        {new Date(folder.updatedAt).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>
      <td className='px-6 py-4 text-sm text-gray-600'>-</td>
      <td className='px-6 py-4'>
        <div className='flex items-center gap-2'>
          <MenuModal
            opened={menuOpened}
            setOpened={setMenuOpened}
            withinPortal={true}
            trigger={
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpened(true);
                }}
                className='hover:bg-gray-100'
              >
                <IconDots className='size-4 text-gray-600' />
              </IconButton>
            }
            position='bottom-end'
          >
            <Menu.Item
              leftSection={<IconArrowRight className='size-4' />}
              onClick={(e) => {
                e.stopPropagation();
                onMove(folder);
                setMenuOpened(false);
              }}
            >
              Move
            </Menu.Item>
            <Menu.Item
              leftSection={<IconPencil className='size-4' />}
              onClick={(e) => {
                e.stopPropagation();
                onRename(folder);
                setMenuOpened(false);
              }}
            >
              Rename
            </Menu.Item>
            <Menu.Item
              leftSection={<IconDownload className='size-4' />}
              onClick={async (e) => {
                e.stopPropagation();
                await handleDownload();
                setMenuOpened(false);
              }}
              disabled={isDownloading}
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash className='size-4' />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(folder);
                setMenuOpened(false);
              }}
              color='red'
            >
              Delete
            </Menu.Item>
          </MenuModal>
        </div>
      </td>
    </tr>
  );
}

function FileListItem({
  file,
  onPreview,
  onRename,
  onDelete,
  onMoveToFolder,
}: {
  file: import('../../../store/types/fileManager.types').TFileManagerFile;
  onPreview: (file: import('../../../store/types/fileManager.types').TFileManagerFile) => void;
  onRename: (file: import('../../../store/types/fileManager.types').TFileManagerFile) => void;
  onDelete: (file: import('../../../store/types/fileManager.types').TFileManagerFile) => void;
  onMoveToFolder: (file: import('../../../store/types/fileManager.types').TFileManagerFile) => void;
}) {
  const [menuOpened, setMenuOpened] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const isImage = file.type === 'image' || file.mimeType?.startsWith('image/');
  const isPdf = file.type === 'pdf' || file.mimeType === 'application/pdf';
  const isDocx =
    file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx');

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadFile(file.url, file.name);
      toast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <tr className='hover:bg-gray-50 transition-colors'>
      <td className='px-6 py-4'>
        <input type='checkbox' className='rounded border-gray-300' />
      </td>
      <td className='px-6 py-4'>
        <div className='flex items-center gap-3'>
          {isImage ? (
            <Image
              src={file.url}
              alt={file.name}
              className='w-10 h-10 rounded object-cover shrink-0'
              height={40}
              width={40}
            />
          ) : (
            <div className='w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0'>
              {isPdf ? (
                <IconFileTypePdf className='size-6 text-red-500' />
              ) : isDocx ? (
                <IconFileTypeDocx className='size-6 text-blue-500' />
              ) : (
                <IconFile className='size-6 text-gray-400' />
              )}
            </div>
          )}
          <span className='text-sm font-medium text-gray-900 truncate max-w-xs'>{file.name}</span>
        </div>
      </td>
      <td className='px-6 py-4 text-sm text-gray-600'>
        {file.CreatedBy?.name || file.createdBy || '-'}
      </td>
      <td className='px-6 py-4 text-sm text-gray-600'>
        {new Date(file.updatedAt).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>
      <td className='px-6 py-4 text-sm text-gray-600'>
        {file.size ? formatBytes(file.size) : '-'}
      </td>
      <td className='px-6 py-4'>
        <div className='flex items-center gap-2'>
          <IconButton onClick={() => onPreview(file)} className='hover:bg-gray-100' title='Preview'>
            <IconEye className='size-4 text-gray-600' />
          </IconButton>
          <IconButton
            onClick={handleDownload}
            className='hover:bg-gray-100'
            title='Download'
            disabled={isDownloading}
          >
            <IconDownload className='size-4 text-gray-600' />
          </IconButton>
          <MenuModal
            opened={menuOpened}
            setOpened={setMenuOpened}
            withinPortal={true}
            trigger={
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpened(true);
                }}
                className='hover:bg-gray-100'
              >
                <IconDots className='size-4 text-gray-600' />
              </IconButton>
            }
            position='bottom-end'
          >
            <Menu.Item
              leftSection={<IconArrowRight className='size-4' />}
              onClick={(e) => {
                e.stopPropagation();
                onMoveToFolder(file);
                setMenuOpened(false);
              }}
            >
              Move to Folder
            </Menu.Item>
            <Menu.Item
              leftSection={<IconPencil className='size-4' />}
              onClick={(e) => {
                e.stopPropagation();
                onRename(file);
                setMenuOpened(false);
              }}
            >
              Rename
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrash className='size-4' />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file);
                setMenuOpened(false);
              }}
              color='red'
            >
              Delete
            </Menu.Item>
          </MenuModal>
        </div>
      </td>
    </tr>
  );
}
